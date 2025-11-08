import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple green square with Christmas tree emoji as SVG
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#16a34a" rx="102"/>
  <text x="256" y="380" font-size="300" text-anchor="middle" fill="white" font-family="Arial, sans-serif">🎄</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Generate 192x192 icon
  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  
  console.log('✓ Generated pwa-192x192.png');
  
  // Generate 512x512 icon
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  
  console.log('✓ Generated pwa-512x512.png');
  
  // Also generate a favicon
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  
  console.log('✓ Generated favicon.png');
  console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);

