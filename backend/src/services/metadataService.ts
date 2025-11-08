import axios from 'axios';
import * as cheerio from 'cheerio';
import { ProductMetadata, Item } from '../types';

export class MetadataService {
  private static readonly TIMEOUT = 8000; // 8 seconds
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Main entry point - fetches metadata from a product URL
   */
  static async fetchMetadata(url: string): Promise<ProductMetadata> {
    try {
      // Validate and normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      if (!normalizedUrl) {
        return this.createErrorResult('Invalid URL', 'Unknown');
      }

      const retailer = this.detectRetailer(normalizedUrl);

      // Build headers with retailer-specific customizations
      const headers: any = {
        'User-Agent': this.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      };

      // Add referrer for Amazon to appear more legitimate
      if (retailer === 'Amazon') {
        const urlObj = new URL(normalizedUrl);
        headers['Referer'] = `${urlObj.protocol}//${urlObj.host}/`;
      }

      // Fetch HTML
      const response = await axios.get(normalizedUrl, {
        timeout: this.TIMEOUT,
        headers,
        maxRedirects: 5,
      });

      const html = response.data;

      // Check for bot detection/CAPTCHA pages
      if (html.length < 10000 && (
        html.includes('captcha') ||
        html.includes('api-services-support@amazon.com') ||
        html.includes('Robot Check')
      )) {
        return this.createErrorResult('Access blocked - bot detection triggered', retailer);
      }

      // Route to appropriate parser
      let metadata: ProductMetadata;
      switch (retailer) {
        case 'Amazon':
          metadata = this.parseAmazon(html, normalizedUrl);
          break;
        case 'Target':
          metadata = this.parseTarget(html, normalizedUrl);
          break;
        case 'Walmart':
          metadata = this.parseWalmart(html, normalizedUrl);
          break;
        case 'Best Buy':
          metadata = this.parseBestBuy(html, normalizedUrl);
          break;
        default:
          metadata = this.parseGeneric(html, normalizedUrl);
      }

      return metadata;

    } catch (error: any) {
      const retailer = this.detectRetailer(url);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return this.createErrorResult('Request timeout', retailer);
        }
        if (error.response?.status === 403 || error.response?.status === 429) {
          return this.createErrorResult('Access blocked by retailer', retailer);
        }
        if (error.response?.status === 404) {
          return this.createErrorResult('Product not found', retailer);
        }
      }

      return this.createErrorResult('Failed to fetch product data', retailer);
    }
  }

  /**
   * Detect retailer from URL
   */
  private static detectRetailer(url: string): string {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      if (hostname.includes('amazon.')) return 'Amazon';
      if (hostname.includes('target.')) return 'Target';
      if (hostname.includes('walmart.')) return 'Walmart';
      if (hostname.includes('bestbuy.')) return 'Best Buy';
      if (hostname.includes('etsy.')) return 'Etsy';
      if (hostname.includes('ebay.')) return 'eBay';

      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Generic parser using Open Graph and meta tags
   */
  private static parseGeneric(html: string, url: string): ProductMetadata {
    const $ = cheerio.load(html);
    const retailer = this.detectRetailer(url);

    // Try Open Graph tags first
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogPrice = $('meta[property="og:price:amount"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');

    // Fallback to other meta tags
    const title = ogTitle ||
                  $('meta[name="title"]').attr('content') ||
                  $('title').text().trim();

    const imageUrl = ogImage ||
                     $('meta[property="twitter:image"]').attr('content') ||
                     $('meta[name="image"]').attr('content');

    const price = ogPrice ? parseFloat(ogPrice) : null;

    const hasData = !!(title || price || imageUrl);

    return {
      name: title || null,
      price: price,
      image_url: this.isValidImageUrl(imageUrl) ? imageUrl! : null,
      retailer,
      success: hasData,
      error: !hasData ? 'No product metadata found' : undefined,
    };
  }

  /**
   * Amazon-specific parser
   */
  private static parseAmazon(html: string, url: string): ProductMetadata {
    const $ = cheerio.load(html);

    // Try to extract from JSON-LD structured data first (most reliable)
    let name: string | null = null;
    let price: number | null = null;
    let imageUrl: string | undefined = undefined;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (!jsonText) return;

        const json = JSON.parse(jsonText);

        // Handle both single Product and array of objects
        const product = Array.isArray(json)
          ? json.find((item: any) => item['@type'] === 'Product')
          : json['@type'] === 'Product' ? json : null;

        if (product) {
          if (product.name && !name) {
            name = product.name;
          }
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            if (offer.price && !price) {
              price = parseFloat(offer.price);
            }
          }
          if (product.image && !imageUrl) {
            imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
          }
        }
      } catch {
        // Skip invalid JSON
      }
    });

    // Fallback to HTML parsing if JSON-LD didn't provide data
    if (!name) {
      name = $('#productTitle').text().trim() ||
             $('#title').text().trim() ||
             $('span#productTitle').text().trim() ||
             $('h1 span#productTitle').text().trim() ||
             // Amazon Luxury Stores (bond) products
             $('span#bond-title-desktop').text().trim() ||
             $('#bond-title-block').text().trim() ||
             // Generic fallbacks
             $('h1').first().text().trim() ||
             $('title').text().trim().replace(/^Amazon\.com:\s*/, '').replace(/\s*:.*$/, '') ||
             $('meta[property="og:title"]').attr('content') ||
             null;

      // Clean up the name if it was found
      if (name) {
        name = name.replace(/\s+/g, ' ').trim();
      }
    }

    // Price - try multiple selectors
    if (!price) {
      const priceText = $('.a-price .a-offscreen').first().text() ||
                        $('.priceToPay .a-offscreen').first().text() ||
                        $('.apexPriceToPay .a-offscreen').first().text() ||
                        $('#priceblock_ourprice').text() ||
                        $('#priceblock_dealprice').text() ||
                        $('[data-a-color="price"]').first().text() ||
                        $('meta[property="og:price:amount"]').attr('content');

      price = this.extractPrice(priceText);
    }

    // Image - high resolution if available
    if (!imageUrl) {
      imageUrl = $('#landingImage').attr('src') ||
                 $('#imgBlkFront').attr('src') ||
                 $('#main-image').attr('src') ||
                 $('.a-dynamic-image').first().attr('src') ||
                 $('meta[property="og:image"]').attr('content');
    }

    const hasData = !!(name || price || imageUrl);

    return {
      name: name || null,
      price,
      image_url: this.isValidImageUrl(imageUrl) ? imageUrl! : null,
      retailer: 'Amazon',
      success: hasData,
      error: !hasData ? 'Unable to parse Amazon product data' : undefined,
    };
  }

  /**
   * Target-specific parser
   */
  private static parseTarget(html: string, url: string): ProductMetadata {
    const $ = cheerio.load(html);

    // Target often uses data attributes and specific classes
    const name = $('h1[data-test="product-title"]').text().trim() ||
                 $('h1').first().text().trim() ||
                 $('meta[property="og:title"]').attr('content');

    const priceText = $('div[data-test="product-price"]').text() ||
                      $('span[data-test="product-price"]').text() ||
                      $('[data-test="product-price"]').first().text() ||
                      $('meta[property="og:price:amount"]').attr('content');

    const price = this.extractPrice(priceText);

    const imageUrl = $('img[data-test="product-image"]').attr('src') ||
                     $('picture img').first().attr('src') ||
                     $('meta[property="og:image"]').attr('content');

    const hasData = !!(name || price || imageUrl);

    return {
      name: name || null,
      price,
      image_url: this.isValidImageUrl(imageUrl) ? imageUrl! : null,
      retailer: 'Target',
      success: hasData,
      error: !hasData ? 'Unable to parse Target product data' : undefined,
    };
  }

  /**
   * Walmart-specific parser
   */
  private static parseWalmart(html: string, url: string): ProductMetadata {
    const $ = cheerio.load(html);

    const name = $('h1[itemprop="name"]').text().trim() ||
                 $('h1').first().text().trim() ||
                 $('meta[property="og:title"]').attr('content');

    // Try multiple price selectors (Walmart's DOM changes frequently)
    const priceText = $('[data-testid="price-wrap"]').text() ||
                      $('[itemprop="price"]').attr('content') ||
                      $('span[itemprop="price"]').attr('content') ||
                      $('span.price-characteristic').text() ||
                      $('.price-group .price').first().text() ||
                      $('[class*="price"]').first().text() ||
                      $('meta[property="og:price:amount"]').attr('content');

    const price = this.extractPrice(priceText);

    const imageUrl = $('img[data-testid="hero-image"]').attr('src') ||
                     $('img.hover-zoom-hero-image').attr('src') ||
                     $('meta[property="og:image"]').attr('content');

    const hasData = !!(name || price || imageUrl);

    return {
      name: name || null,
      price,
      image_url: this.isValidImageUrl(imageUrl) ? imageUrl! : null,
      retailer: 'Walmart',
      success: hasData,
      error: !hasData ? 'Unable to parse Walmart product data' : undefined,
    };
  }

  /**
   * Best Buy-specific parser
   */
  private static parseBestBuy(html: string, url: string): ProductMetadata {
    const $ = cheerio.load(html);

    const name = $('h1.heading-5').text().trim() ||
                 $('div.sku-title h1').text().trim() ||
                 $('h1').first().text().trim() ||
                 $('meta[property="og:title"]').attr('content');

    const priceText = $('div.priceView-customer-price span').first().text() ||
                      $('.priceView-hero-price span').first().text() ||
                      $('meta[property="og:price:amount"]').attr('content');

    const price = this.extractPrice(priceText);

    const imageUrl = $('img.primary-image').attr('src') ||
                     $('.shop-media img').first().attr('src') ||
                     $('meta[property="og:image"]').attr('content');

    const hasData = !!(name || price || imageUrl);

    return {
      name: name || null,
      price,
      image_url: this.isValidImageUrl(imageUrl) ? imageUrl! : null,
      retailer: 'Best Buy',
      success: hasData,
      error: !hasData ? 'Unable to parse Best Buy product data' : undefined,
    };
  }

  /**
   * Extract price from text string
   */
  private static extractPrice(text: string | undefined): number | null {
    if (!text) return null;

    // Remove currency symbols, commas, and extract first number
    const cleaned = text.replace(/[$,]/g, '').trim();
    const match = cleaned.match(/(\d+\.?\d*)/);

    if (match) {
      const price = parseFloat(match[1]);
      return price > 0 ? price : null;
    }

    return null;
  }

  /**
   * Normalize URL (add https if missing)
   */
  private static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      // Try adding https://
      try {
        const urlObj = new URL(`https://${url}`);
        return urlObj.href;
      } catch {
        return '';
      }
    }
  }

  /**
   * Check if URL is a valid image URL
   */
  private static isValidImageUrl(url: string | undefined): boolean {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const hostname = urlObj.hostname.toLowerCase();

      // Check for common image extensions
      if (pathname.includes('.jpg') ||
          pathname.includes('.jpeg') ||
          pathname.includes('.png') ||
          pathname.includes('.webp') ||
          pathname.includes('.gif')) {
        return true;
      }

      // Check for known CDN patterns
      if (hostname.includes('images-amazon.com') ||
          hostname.includes('media-amazon.com') ||
          hostname.includes('target.scene7.com') ||
          hostname.includes('i5.walmartimages.com') ||
          hostname.includes('pisces.bbystatic.com')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Create an error result
   */
  private static createErrorResult(error: string, retailer: string): ProductMetadata {
    return {
      name: null,
      price: null,
      image_url: null,
      retailer,
      success: false,
      error,
    };
  }
}

/**
 * Helper function to determine if item metadata should be refreshed
 */
export function shouldRefreshMetadata(item: Item): boolean {
  if (!item.link) return false;
  if (!item.last_fetched_at) return true; // Never fetched

  const lastFetch = new Date(item.last_fetched_at);
  const now = new Date();
  const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastFetch >= 24;
}
