const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../../../../newfavicon.jpeg');

async function createIco(pngBuffers, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images

  let offset = 6 + (pngBuffers.length * 16);
  const dirEntries = [];

  for (let i = 0; i < pngBuffers.length; i++) {
    const buf = pngBuffers[i];
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function generate() {
  console.log('Generating favicon assets from:', src);
  if (!fs.existsSync(src)) {
    throw new Error('Source file not found: ' + src);
  }

  const webRoot = path.resolve(__dirname, '../..');
  const publicDir = path.join(webRoot, 'public');
  const appDir = path.join(webRoot, 'src', 'app');

  // 1. Generate multi-resolution ICO (16, 32, 48, 64) with strict RGBA format
  const icoSizes = [16, 32, 48];
  const icoPngs = await Promise.all(
    icoSizes.map(s => sharp(src).ensureAlpha().resize(s, s).png().toBuffer())
  );
  const icoBuffer = await createIco(icoPngs, icoSizes);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✓ favicon.ico created (public + app) in RGBA format');

  // 2. Standard PNGs
  await sharp(src).ensureAlpha().resize(96, 96).png().toFile(path.join(publicDir, 'favicon-96x96.png'));
  console.log('✓ favicon-96x96.png created');

  await sharp(src).ensureAlpha().resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(src).ensureAlpha().resize(32, 32).png().toFile(path.join(appDir, 'icon.png'));
  console.log('✓ favicon.png & app/icon.png created');

  await sharp(src).ensureAlpha().resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(src).ensureAlpha().resize(180, 180).png().toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✓ apple-touch-icon.png & app/apple-icon.png created');

  await sharp(src).resize(192, 192).png().toFile(path.join(publicDir, 'web-app-manifest-192x192.png'));
  console.log('✓ web-app-manifest-192x192.png created');

  await sharp(src).resize(512, 512).png().toFile(path.join(publicDir, 'web-app-manifest-512x512.png'));
  console.log('✓ web-app-manifest-512x512.png created');

  // 3. Copy original JPEG into public as favicon.jpeg
  fs.copyFileSync(src, path.join(publicDir, 'favicon.jpeg'));
  console.log('✓ favicon.jpeg copied');

  // 4. Create modern SVG favicon
  const png512Base64 = (await sharp(src).resize(512, 512).png().toBuffer()).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#ffffff"/>
  <image width="512" height="512" href="data:image/png;base64,${png512Base64}"/>
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('✓ favicon.svg created');

  console.log('All favicon assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
