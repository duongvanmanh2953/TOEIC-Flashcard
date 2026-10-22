const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function distribute() {
  const root = path.resolve(__dirname, '..');

  // Read existing master clean badges:
  // We want:
  // - Light Theme (UI is light / white background) -> needs Blue Badge (high contrast, vivid)
  // - Dark Theme (UI is dark / slate-950 background) -> needs White Badge (crisp, high contrast)
  
  // Let's extract freshly or read from existing assets:
  // Note: assets/LetStuN.png is the master image.
  // Left badge: X=113, Y=409, W=974, H=1016 (White squircle)
  // Right badge: X=1313, Y=409, W=974, H=1016 (Blue squircle)

  // Let's inspect assets/letstun-logo-light.png and assets/letstun-logo-dark.png
  // If assets/test-left-clean.png exists or we use the existing files:
  let whiteBadgeBuffer, blueBadgeBuffer;
  if (fs.existsSync(path.join(root, 'assets/test-left-clean.png')) && fs.existsSync(path.join(root, 'assets/test-right-clean.png'))) {
    whiteBadgeBuffer = fs.readFileSync(path.join(root, 'assets/test-left-clean.png'));
    blueBadgeBuffer = fs.readFileSync(path.join(root, 'assets/test-right-clean.png'));
  } else {
    // Current assets: letstun-logo-light.png was white, letstun-logo-dark.png was blue
    const img1 = fs.readFileSync(path.join(root, 'assets/letstun-logo-light.png'));
    const img2 = fs.readFileSync(path.join(root, 'assets/letstun-logo-dark.png'));
    const stats1 = await sharp(img1).stats();
    // Image with higher mean brightness is white badge, lower is blue badge
    const mean1 = stats1.channels.slice(0, 3).reduce((a, b) => a + b.mean, 0) / 3;
    if (mean1 > 150) {
      whiteBadgeBuffer = img1;
      blueBadgeBuffer = img2;
    } else {
      whiteBadgeBuffer = img2;
      blueBadgeBuffer = img1;
    }
  }

  const whiteMeta = await sharp(whiteBadgeBuffer).metadata();
  const blueMeta = await sharp(blueBadgeBuffer).metadata();
  console.log('Detected White badge:', whiteMeta.width, 'x', whiteMeta.height);
  console.log('Detected Blue badge:', blueMeta.width, 'x', blueMeta.height);

  // USER CORRECTION:
  // "mà bạn đang nhầm giữa logo dark và light rồi"
  // Light Theme Logo (for light backgrounds) = Blue badge!
  // Dark Theme Logo (for dark backgrounds) = White badge!
  const lightThemeLogo = blueBadgeBuffer;
  const darkThemeLogo = whiteBadgeBuffer;

  // Generate 256x256 versions
  const lightTheme256 = await sharp(lightThemeLogo).resize(256, 256).png().toBuffer();
  const darkTheme256 = await sharp(darkThemeLogo).resize(256, 256).png().toBuffer();

  // Generate 32x32, 16x16 for favicon.ico and favicon.png
  const faviconPng = await sharp(lightThemeLogo).resize(256, 256).png().toBuffer();
  const png32 = await sharp(lightThemeLogo).resize(32, 32).png().toBuffer();
  const png16 = await sharp(lightThemeLogo).resize(16, 16).png().toBuffer();

  // Build standard multi-resolution .ico file (16x16 and 32x32)
  function createIco(images) {
    const numImages = images.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    let offset = headerSize + numImages * dirEntrySize;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // ICO type
    header.writeUInt16LE(numImages, 4);

    const dirEntries = [];
    const buffers = [];

    for (const img of images) {
      const entry = Buffer.alloc(dirEntrySize);
      entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
      entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
      entry.writeUInt8(0, 2); // palette
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel
      entry.writeUInt32LE(img.buffer.length, 8); // size
      entry.writeUInt32LE(offset, 12); // offset
      offset += img.buffer.length;

      dirEntries.push(entry);
      buffers.push(img.buffer);
    }

    return Buffer.concat([header, ...dirEntries, ...buffers]);
  }

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 }
  ]);

  // Clean SVG wrapping LetStuN Logo
  const base64Blue256 = lightTheme256.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <image width="512" height="512" href="data:image/png;base64,${base64Blue256}" />
</svg>
`;

  // Write master assets
  fs.writeFileSync(path.join(root, 'assets/letstun-logo-light.png'), lightThemeLogo);
  fs.writeFileSync(path.join(root, 'assets/letstun-logo-light-256.png'), lightTheme256);
  fs.writeFileSync(path.join(root, 'assets/letstun-logo-dark.png'), darkThemeLogo);
  fs.writeFileSync(path.join(root, 'assets/letstun-logo-dark-256.png'), darkTheme256);
  fs.writeFileSync(path.join(root, 'assets/letstun-logo.png'), lightThemeLogo);
  fs.writeFileSync(path.join(root, 'assets/letstun-logo-256.png'), lightTheme256);
  fs.writeFileSync(path.join(root, 'assets/vocabflow-logo.png'), lightThemeLogo);
  fs.writeFileSync(path.join(root, 'assets/vocabflow-logo-256.png'), lightTheme256);
  fs.writeFileSync(path.join(root, 'assets/vocabflow-logo.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(root, 'assets/favicon.png'), faviconPng);
  fs.writeFileSync(path.join(root, 'assets/favicon.ico'), icoBuffer);

  const targets = [
    'apps/web/public',
    'apps/landing/public',
    'apps/student/public',
    'apps/admin/public',
    'apps/kid/public',
    'services/app-api/assets',
    'services/admin-api/assets',
    'services/kid-api/assets',
    'apps/api/assets'
  ];

  for (const t of targets) {
    const fullPath = path.join(root, t);
    if (fs.existsSync(fullPath)) {
      console.log('Deploying to:', t);
      // Light theme logo (Blue badge)
      fs.writeFileSync(path.join(fullPath, 'letstun-logo-light.png'), lightThemeLogo);
      fs.writeFileSync(path.join(fullPath, 'letstun-logo-light-256.png'), lightTheme256);

      // Dark theme logo (White badge)
      fs.writeFileSync(path.join(fullPath, 'letstun-logo-dark.png'), darkThemeLogo);
      fs.writeFileSync(path.join(fullPath, 'letstun-logo-dark-256.png'), darkTheme256);

      // Default primary logos
      fs.writeFileSync(path.join(fullPath, 'letstun-logo.png'), lightThemeLogo);
      fs.writeFileSync(path.join(fullPath, 'letstun-logo-256.png'), lightTheme256);

      // Overwrite legacy logo files so old links/caches show LetStuN!
      fs.writeFileSync(path.join(fullPath, 'vocabflow-logo.png'), lightThemeLogo);
      fs.writeFileSync(path.join(fullPath, 'vocabflow-logo-256.png'), lightTheme256);
      fs.writeFileSync(path.join(fullPath, 'vocabflow-logo.svg'), svgContent, 'utf8');

      // Favicons
      if (t.includes('public')) {
        fs.writeFileSync(path.join(fullPath, 'favicon.png'), faviconPng);
        fs.writeFileSync(path.join(fullPath, 'favicon.ico'), icoBuffer);
      }
    }
  }

  // Also sync vocalflow-fox-logo.png with letstun-fox-logo.png
  const kidUiDirs = [
    'assets/kid/ui',
    'apps/admin/public/kid/ui',
    'apps/admin/public/assets/kid/ui',
    'apps/kid/public/kid/ui',
    'apps/kid/public/assets/kid/ui',
    'apps/student/public/kid/ui',
    'apps/student/public/assets/kid/ui',
    'apps/web/public/kid/ui'
  ];

  for (const d of kidUiDirs) {
    const fullD = path.join(root, d);
    if (fs.existsSync(fullD)) {
      const letstunFox = path.join(fullD, 'letstun-fox-logo.png');
      const vocalflowFox = path.join(fullD, 'vocalflow-fox-logo.png');
      if (fs.existsSync(letstunFox)) {
        const foxBuf = fs.readFileSync(letstunFox);
        fs.writeFileSync(vocalflowFox, foxBuf);
        console.log('Synced fox logo in:', d);
      }
    }
  }

  console.log('All logos updated and distributed successfully!');
}

distribute().catch(console.error);
