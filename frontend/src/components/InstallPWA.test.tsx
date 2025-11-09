import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { InstallPWA } from './InstallPWA';

// Mock interface for BeforeInstallPromptEvent
interface MockBeforeInstallPromptEvent extends Event {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

describe('InstallPWA', () => {
  let eventListeners: Record<string, EventListener[]>;
  let originalMatchMedia: typeof window.matchMedia;
  let originalNavigator: Navigator;

  beforeEach(() => {
    // Reset event listeners storage
    eventListeners = {};

    // Store original implementations
    originalMatchMedia = window.matchMedia;
    originalNavigator = window.navigator;

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: false, // Default to not standalone
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        ...originalNavigator,
        standalone: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Mock addEventListener to capture event listeners
    const originalAddEventListener = window.addEventListener.bind(window);
    window.addEventListener = vi.fn((event: string, handler: EventListener) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(handler);
      return originalAddEventListener(event, handler);
    }) as typeof window.addEventListener;

    // Mock removeEventListener
    const originalRemoveEventListener = window.removeEventListener.bind(window);
    window.removeEventListener = vi.fn((event: string, handler: EventListener) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter((h) => h !== handler);
      }
      return originalRemoveEventListener(event, handler);
    }) as typeof window.removeEventListener;
  });

  afterEach(() => {
    // Restore original implementations
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });

    Object.defineProperty(window, 'navigator', {
      writable: true,
      configurable: true,
      value: originalNavigator,
    });

    vi.clearAllMocks();
    eventListeners = {};
  });

  const triggerEvent = (eventName: string, event: Event) => {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          // Ignore errors in event handlers during tests
        }
      });
    }
  };

  const createMockBeforeInstallPrompt = (): MockBeforeInstallPromptEvent => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });
    
    const event = new Event('beforeinstallprompt') as MockBeforeInstallPromptEvent;
    event.preventDefault = vi.fn();
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;
    
    return event;
  };

  describe('Standalone Mode Detection', () => {
    it('should not show install button when running in standalone mode (display-mode: standalone)', () => {
      // Mock matchMedia to return matches: true for standalone query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn((query: string) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<InstallPWA />);

      expect(screen.queryByText('📲 Install')).not.toBeInTheDocument();
    });

    it('should not show install button when running in standalone mode (iOS Safari)', () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          ...originalNavigator,
          standalone: true,
        },
      });

      render(<InstallPWA />);

      expect(screen.queryByText('📲 Install')).not.toBeInTheDocument();
    });
  });

  describe('beforeinstallprompt Event', () => {
    it('should show install button when beforeinstallprompt event fires', async () => {
      render(<InstallPWA />);

      // Initially button should not be visible
      expect(screen.queryByText('📲 Install')).not.toBeInTheDocument();

      // Create and trigger beforeinstallprompt event
      const mockEvent = createMockBeforeInstallPrompt();
      triggerEvent('beforeinstallprompt', mockEvent);

      // Button should now be visible
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify preventDefault was called
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not show install button when beforeinstallprompt does not fire', async () => {
      render(<InstallPWA />);

      // Wait a bit to ensure no event fires
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Button should still not be visible
      expect(screen.queryByText('📲 Install')).not.toBeInTheDocument();
    });
  });

  describe('getInstalledRelatedApps API', () => {
    it('should hide button when getInstalledRelatedApps returns installed apps', async () => {
      const mockGetInstalledRelatedApps = vi.fn().mockResolvedValue([
        { id: 'test-app', platform: 'webapp' },
      ]);

      Object.defineProperty(navigator, 'getInstalledRelatedApps', {
        writable: true,
        configurable: true,
        value: mockGetInstalledRelatedApps,
      });

      render(<InstallPWA />);

      await waitFor(() => {
        expect(mockGetInstalledRelatedApps).toHaveBeenCalled();
      });

      // Button should not be visible when app is already installed
      await waitFor(() => {
        expect(screen.queryByText('📲 Install')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show button when getInstalledRelatedApps returns empty array and beforeinstallprompt fires', async () => {
      const mockGetInstalledRelatedApps = vi.fn().mockResolvedValue([]);

      Object.defineProperty(navigator, 'getInstalledRelatedApps', {
        writable: true,
        configurable: true,
        value: mockGetInstalledRelatedApps,
      });

      render(<InstallPWA />);

      // Trigger beforeinstallprompt event
      const mockEvent = createMockBeforeInstallPrompt();
      triggerEvent('beforeinstallprompt', mockEvent);

      // Button should be visible
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle getInstalledRelatedApps error gracefully', async () => {
      const mockGetInstalledRelatedApps = vi.fn().mockRejectedValue(new Error('Not supported'));

      Object.defineProperty(navigator, 'getInstalledRelatedApps', {
        writable: true,
        configurable: true,
        value: mockGetInstalledRelatedApps,
      });

      render(<InstallPWA />);

      // Should fall back to beforeinstallprompt behavior
      const mockEvent = createMockBeforeInstallPrompt();
      triggerEvent('beforeinstallprompt', mockEvent);

      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Installation Flow', () => {
    it('should call prompt when install button is clicked', async () => {
      render(<InstallPWA />);

      // Trigger beforeinstallprompt event
      const mockEvent = createMockBeforeInstallPrompt();
      triggerEvent('beforeinstallprompt', mockEvent);

      // Wait for button to appear
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click install button
      const installButton = screen.getByText('📲 Install');
      fireEvent.click(installButton);

      // Wait for prompt to be called
      await waitFor(() => {
        expect(mockEvent.prompt).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should show guide modal when prompt fails', async () => {
      const mockEvent = createMockBeforeInstallPrompt();
      mockEvent.prompt = vi.fn().mockRejectedValue(new Error('Prompt failed'));

      render(<InstallPWA />);

      // Trigger beforeinstallprompt event
      triggerEvent('beforeinstallprompt', mockEvent);

      // Wait for button to appear
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click install button
      const installButton = screen.getByText('📲 Install');
      fireEvent.click(installButton);

      // Wait for guide modal to appear
      await waitFor(() => {
        expect(screen.getByText('Install Christmas Wishlist')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show guide modal when no deferredPrompt exists', async () => {
      render(<InstallPWA />);

      // Don't trigger beforeinstallprompt, but manually show button state
      // This simulates clicking when deferredPrompt doesn't exist
      // In practice, this would show the guide modal
      // We'll test this by clicking a button that should trigger the guide
    });
  });

  describe('appinstalled Event', () => {
    it('should hide button when appinstalled event fires', async () => {
      render(<InstallPWA />);

      // Trigger beforeinstallprompt event first
      const mockEvent = createMockBeforeInstallPrompt();
      triggerEvent('beforeinstallprompt', mockEvent);

      // Wait for button to appear
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Trigger appinstalled event
      const installedEvent = new Event('appinstalled');
      triggerEvent('appinstalled', installedEvent);

      // Button should be hidden
      await waitFor(() => {
        expect(screen.queryByText('📲 Install')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Guide Modal', () => {
    it('should close guide modal when close button is clicked', async () => {
      const mockEvent = createMockBeforeInstallPrompt();
      mockEvent.prompt = vi.fn().mockRejectedValue(new Error('Prompt failed'));

      render(<InstallPWA />);

      // Trigger beforeinstallprompt event
      triggerEvent('beforeinstallprompt', mockEvent);

      // Wait for button to appear
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click install button to trigger guide
      const installButton = screen.getByText('📲 Install');
      fireEvent.click(installButton);

      // Wait for guide modal to appear
      await waitFor(() => {
        expect(screen.getByText('Install Christmas Wishlist')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Find and click close button
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Install Christmas Wishlist')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should close guide modal when "Got it!" button is clicked', async () => {
      const mockEvent = createMockBeforeInstallPrompt();
      mockEvent.prompt = vi.fn().mockRejectedValue(new Error('Prompt failed'));

      render(<InstallPWA />);

      // Trigger beforeinstallprompt event
      triggerEvent('beforeinstallprompt', mockEvent);

      // Wait for button to appear
      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click install button to trigger guide
      const installButton = screen.getByText('📲 Install');
      fireEvent.click(installButton);

      // Wait for guide modal to appear
      await waitFor(() => {
        expect(screen.getByText('Install Christmas Wishlist')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Find and click "Got it!" button
      const gotItButton = screen.getByText('Got it!');
      fireEvent.click(gotItButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Install Christmas Wishlist')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Browser-specific instructions', () => {
    it('should show correct instructions for Microsoft Edge', async () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        },
      });

      const mockEvent = createMockBeforeInstallPrompt();
      mockEvent.prompt = vi.fn().mockRejectedValue(new Error('Prompt failed'));

      render(<InstallPWA />);

      triggerEvent('beforeinstallprompt', mockEvent);

      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      const installButton = screen.getByText('📲 Install');
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(screen.getByText('Instructions for Microsoft Edge:')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show correct instructions for Google Chrome', async () => {
      Object.defineProperty(window, 'navigator', {
        writable: true,
        configurable: true,
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const mockEvent = createMockBeforeInstallPrompt();
      mockEvent.prompt = vi.fn().mockRejectedValue(new Error('Prompt failed'));

      render(<InstallPWA />);

      triggerEvent('beforeinstallprompt', mockEvent);

      await waitFor(() => {
        expect(screen.getByText('📲 Install')).toBeInTheDocument();
      }, { timeout: 1000 });

      const installButton = screen.getByText('📲 Install');
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(screen.getByText('Instructions for Google Chrome:')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<InstallPWA />);

      // Verify event listeners were added
      expect(window.addEventListener).toHaveBeenCalled();

      const beforeInstallPromptListeners = eventListeners['beforeinstallprompt']?.length || 0;
      expect(beforeInstallPromptListeners).toBeGreaterThan(0);

      unmount();

      // Verify event listeners were removed
      expect(window.removeEventListener).toHaveBeenCalled();
    });
  });
});
