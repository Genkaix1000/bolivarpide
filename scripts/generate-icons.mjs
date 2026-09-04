import sharp from "sharp";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "icons");
const ICON_SIZES = [192, 512];

async function rasterize(svgName, destPath, size) {
  await sharp(join(SRC, svgName), { density: 96 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(destPath);
  console.log(`✓ ${destPath} (${size}x${size})`);
}

async function main() {
  mkdirSync(SRC, { recursive: true });

  for (const s of ICON_SIZES) {
    await rasterize("icon-any.svg", join(SRC, `icon-${s}x${s}.png`), s);
    await rasterize("icon-maskable.svg", join(SRC, `icon-maskable-${s}x${s}.png`), s);
  }

  await rasterize("icon-apple.svg", join(SRC, "apple-touch-icon-180x180.png"), 180);

  // Favicon de marca vía convención app/icon.png (Next genera <link rel="icon">).
  rmSync(join(ROOT, "src", "app", "favicon.ico"), { force: true });
  await rasterize("icon-any.svg", join(ROOT, "src", "app", "icon.png"), 512);

  console.log("Íconos PWA generados.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});