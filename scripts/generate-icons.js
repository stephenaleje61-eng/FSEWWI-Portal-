import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
const logoSvgPath = path.join(publicDir, 'logo.svg');

async function generate() {
  if (!fs.existsSync(logoSvgPath)) {
    console.error('logo.svg does not exist in public/');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(logoSvgPath);

  // 1. 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 4. 512x512 Maskable icon (with 15% safe-zone padding and white circular background)
  const innerSize = Math.round(512 * 0.76); // 388px inner size inside 512px canvas
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 45, b: 114, alpha: 1 }, // Brand blue #0b2d72
    },
  })
    .composite([
      {
        input: innerBuffer,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  console.log('All PWA icon assets generated successfully.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
