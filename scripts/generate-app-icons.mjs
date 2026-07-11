// Regenerates Android launcher icons + web PWA icons from scripts/assets/foodbase-logo.png.
// Run with: node scripts/generate-app-icons.mjs
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'assets', 'foodbase-logo.png');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// dp sizes for each density bucket: legacy launcher icon + adaptive-icon full canvas (108dp base)
const DENSITIES = {
    mdpi: { launcher: 48, canvas: 108 },
    hdpi: { launcher: 72, canvas: 162 },
    xhdpi: { launcher: 96, canvas: 216 },
    xxhdpi: { launcher: 144, canvas: 324 },
    xxxhdpi: { launcher: 192, canvas: 432 },
};

const onBackground = async (size, logoScale, background) => {
    const logoSize = Math.round(size * logoScale);
    const logo = await sharp(SRC).resize(logoSize, logoSize, { fit: 'contain' }).toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background } })
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toBuffer();
};

const run = async () => {
    for (const [density, { launcher, canvas }] of Object.entries(DENSITIES)) {
        const dir = path.join(RES, `mipmap-${density}`);

        // Legacy square/round icons (pre-Android 8): logo baked onto white, ~70% scale.
        const legacy = await onBackground(launcher, 0.7, WHITE);
        await sharp(legacy).toFile(path.join(dir, 'ic_launcher.png'));
        await sharp(legacy).toFile(path.join(dir, 'ic_launcher_round.png'));

        // Adaptive icon foreground layer: transparent bg, logo within the ~66% safe zone.
        // Background layer stays the existing white ic_launcher_background.xml.
        const foreground = await onBackground(canvas, 0.58, TRANSPARENT);
        await sharp(foreground).toFile(path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`✓ mipmap-${density}`);
    }

    // Web / PWA icons
    const PUBLIC = path.join(ROOT, 'public');
    await sharp(await onBackground(192, 0.7, WHITE)).toFile(path.join(PUBLIC, 'logo192.png'));
    await sharp(await onBackground(512, 0.7, WHITE)).toFile(path.join(PUBLIC, 'logo512.png'));
    console.log('✓ public/logo192.png, public/logo512.png');

    console.log('\nDone. Run `npx cap sync android` (or `npm run android`) to pick up the new icons.');
};

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
