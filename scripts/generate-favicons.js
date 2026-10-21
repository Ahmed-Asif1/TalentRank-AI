const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIco(pngBuffers, outputPath) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ICO)
  header.writeUInt16LE(count, 4); // count of images

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    offset += buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
  fs.writeFileSync(outputPath, icoBuffer);
  console.log(`[ico] Wrote ${outputPath} (${icoBuffer.length} bytes, ${count} sizes)`);
}

async function generateFavicons() {
  const baseFile = path.resolve('newfavicon.jpeg');
  if (!fs.existsSync(baseFile)) {
    throw new Error('Base file newfavicon.jpeg not found');
  }

  // 1. Create the inverted high-res base image
  // Inverting newfavicon.jpeg produces deep black background with glowing warm amber/gold logo
  const invertedBase = await sharp(baseFile)
    .negate({ alpha: false })
    .png()
    .toBuffer();

  console.log('[sharp] Inverted base image created successfully');

  // Directories to write to
  const publicDir = path.resolve('apps/web/public');
  const appDir = path.resolve('apps/web/src/app');

  // 2. Generate standard PNG sizes
  const sizes = [
    { size: 96, name: 'favicon-96x96.png' },
    { size: 96, name: 'favicon.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'web-app-manifest-192x192.png' },
    { size: 512, name: 'web-app-manifest-512x512.png' },
  ];

  for (const { size, name } of sizes) {
    const outBuf = await sharp(invertedBase)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, name), outBuf);
    console.log(`[png] Wrote public/${name} (${size}x${size}, ${outBuf.length} bytes)`);
  }

  // Also write app/icon.png and app/apple-icon.png
  const appIconBuf = await sharp(invertedBase)
    .resize(96, 96, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(appDir, 'icon.png'), appIconBuf);
  console.log(`[png] Wrote app/icon.png (96x96)`);

  const appAppleIconBuf = await sharp(invertedBase)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), appAppleIconBuf);
  console.log(`[png] Wrote app/apple-icon.png (180x180)`);

  // 3. Generate multi-resolution ICO (16x16, 32x32, 48x48) with strict RGBA color type 6
  const icoBuffers = await Promise.all([
    sharp(invertedBase).resize(16, 16).ensureAlpha().png().toBuffer().then(buffer => ({ width: 16, height: 16, buffer })),
    sharp(invertedBase).resize(32, 32).ensureAlpha().png().toBuffer().then(buffer => ({ width: 32, height: 32, buffer })),
    sharp(invertedBase).resize(48, 48).ensureAlpha().png().toBuffer().then(buffer => ({ width: 48, height: 48, buffer })),
  ]);

  await createIco(icoBuffers, path.join(publicDir, 'favicon.ico'));
  await createIco(icoBuffers, path.join(appDir, 'favicon.ico'));

  // 4. Generate high-quality SVG embedding the 512x512 inverted PNG as clean responsive vector container
  const base64Png = (await sharp(invertedBase).resize(512, 512).png().toBuffer()).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="64" fill="#000000" />
  <image width="512" height="512" href="data:image/png;base64,${base64Png}" />
</svg>
`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log(`[svg] Wrote public/favicon.svg (${svgContent.length} bytes)`);

  // 5. Update site.webmanifest theme colors to studio dark
  const manifestPath = path.join(publicDir, 'site.webmanifest');
  const manifest = {
    name: "TalentRank AI",
    short_name: "TalentRank",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    theme_color: "#121214",
    background_color: "#121214",
    display: "standalone"
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[manifest] Wrote public/site.webmanifest with studio dark theme`);
}

generateFavicons().then(() => {
  console.log('--- ALL INVERTED FAVICONS GENERATED SUCCESSFULLY ---');
}).catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
