# PWA Installation Guide

## Browser-Specific Installation Instructions

PWA installation works differently in each browser. Follow the instructions for your specific browser below.

### Microsoft Edge (Windows 11)

**Method 1: Via Menu**
1. Open the app in Microsoft Edge
2. Click the **menu button** (⋯) in the top-right corner of the address bar
3. Select **"Apps"** from the dropdown menu
4. Click **"Install this site as an app"**
5. Click **"Install"** in the confirmation dialog
6. The app will appear in your Start menu and can be pinned to your taskbar

**Method 2: Via Address Bar Icon**
1. Look for the **install icon** (➕) in the address bar (usually on the right side)
2. Click the install icon
3. Click **"Install"** in the dialog

**Method 3: Via Settings**
1. Click the menu (⋯) → **"Settings"**
2. Go to **"Apps"** → **"Installed apps"**
3. Look for installation options

### Google Chrome (Windows 11)

**Method 1: Via Address Bar Icon**
1. Look for the **install icon** (➕) in the address bar (right side)
2. Click the install icon
3. Click **"Install"** in the dialog that appears

**Method 2: Via Menu**
1. Click the **menu button** (⋮) in the top-right corner
2. Look for **"Install Christmas Wishlist"** or **"Install app"** option
3. Click it and follow the prompts

### Mozilla Firefox

1. Click the **menu button** (☰) in the top-right corner
2. Look for **"Install"** or **"Install Site as App"** option
3. Click it and follow the prompts

**Note:** PWA support in Firefox may vary by version. Firefox 116+ has better PWA support.

### Safari (iOS/macOS)

**iOS:**
1. Open the app in Safari
2. Tap the **Share button** (square with arrow pointing up) at the bottom
3. Scroll down in the share menu
4. Tap **"Add to Home Screen"**
5. Customize the name if desired
6. Tap **"Add"** in the top-right corner
7. The app will appear on your home screen

**macOS:**
1. Open the app in Safari
2. Click **"File"** → **"Add to Dock"** (if available)
3. Or use the Share button to add to Applications

## Troubleshooting

### Install Option Doesn't Appear

1. **Check Service Worker Registration**
   - Open browser DevTools (F12)
   - Go to "Application" tab (Chrome/Edge) or "Storage" tab (Firefox)
   - Check "Service Workers" section
   - Ensure a service worker is registered and active

2. **Check Manifest**
   - In DevTools, go to "Application" → "Manifest"
   - Verify the manifest is loading correctly
   - Check for any errors

3. **Browser Requirements**
   - Make sure you're using a modern browser (Edge/Chrome/Firefox latest versions)
   - Some browsers require the site to be visited multiple times
   - The site must be served over HTTPS (or localhost for development)

4. **Clear Browser Data**
   - Clear site data and cookies
   - Refresh the page
   - Try installing again

5. **Check Browser Settings**
   - Ensure PWA installation is enabled in browser settings
   - Check if any extensions are blocking installation

### Already Installed?

If the app is already installed:
- The install button/prompt won't appear
- Check your Start menu (Windows) or Applications folder (macOS)
- Look for "Christmas Wishlist" or "Wishlist" in your installed apps

### Development vs Production

- **Development (localhost):** Installation works, but some browsers may be more restrictive
- **Production (HTTPS):** Installation works best when served over HTTPS
- The service worker must be registered for installation to work

## Verification

After installation, verify the app is installed correctly:

1. **Check Standalone Mode**
   - The app should open in its own window (not in a browser tab)
   - No browser address bar should be visible
   - The app should have its own icon in the taskbar/dock

2. **Check Offline Capability**
   - Disconnect from the internet
   - The app should still load (with cached data)
   - Some features may be limited offline

3. **Check Updates**
   - The app should automatically update when new versions are available
   - You'll see an update notification when updates are ready

## Browser Compatibility

| Browser | PWA Support | Install Method |
|---------|-------------|----------------|
| Microsoft Edge | ✅ Full | Menu → Apps → Install |
| Google Chrome | ✅ Full | Address bar icon or menu |
| Mozilla Firefox | ✅ Partial | Menu → Install (varies by version) |
| Safari (iOS) | ✅ Full | Share → Add to Home Screen |
| Safari (macOS) | ⚠️ Limited | File → Add to Dock |
| Opera | ✅ Full | Similar to Chrome |

## Need Help?

If you're still having trouble:
1. Use the **"🔧 PWA Debug"** button (bottom-left in development mode) to check PWA status
2. Click **"📥 How to Install"** button in the navigation for browser-specific instructions
3. Check the browser console (F12) for any errors
4. Verify the service worker is registered in browser DevTools

