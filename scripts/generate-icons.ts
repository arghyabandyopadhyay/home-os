/**
 * Icon Generation Script
 *
 * Converts the source SVG icon to PNG at all required sizes for PWA manifest,
 * maskable icon, and apple-touch-icon.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

import { existsSync, mkdirSync, accessSync, constants } from "node:fs";
import { resolve, dirname } from "node:path";
import type sharp from "sharp";

type Sharp = typeof sharp;

const ROOT_DIR = resolve(dirname(new URL(import.meta.url).pathname), "..");
const SOURCE_SVG = resolve(ROOT_DIR, "public/icons/icon-source.svg");
const OUTPUT_DIR = resolve(ROOT_DIR, "public/icons");

/** Standard PWA icon sizes */
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;

/** Apple touch icon size */
const APPLE_TOUCH_ICON_SIZE = 180;

/** Maskable icon size */
const MASKABLE_SIZE = 512;

/**
 * The maskable safe zone is the inner 80% of the icon.
 * We add 10% padding on each side so content stays within the safe zone.
 * For a 512px icon: 10% padding = 51.2px on each side.
 */
const MASKABLE_PADDING_PERCENT = 0.1;

async function loadSharp(): Promise<Sharp> {
  try {
    const sharpModule = await import("sharp");
    return sharpModule.default ?? sharpModule;
  } catch {
    console.error(
      "Error: 'sharp' is not installed.\n" +
        "Install it as a dev dependency:\n\n" +
        "  npm install --save-dev sharp\n"
    );
    process.exit(1);
  }
}

function validateSourceSvg(): void {
  if (!existsSync(SOURCE_SVG)) {
    console.error(
      `Error: Source SVG not found at ${SOURCE_SVG}\n` +
        "Please create the source icon at public/icons/icon-source.svg"
    );
    process.exit(1);
  }
}

function ensureOutputDirectory(): void {
  if (!existsSync(OUTPUT_DIR)) {
    try {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    } catch (err) {
      console.error(
        `Error: Cannot create output directory at ${OUTPUT_DIR}\n` +
          `${err instanceof Error ? err.message : String(err)}`
      );
      process.exit(1);
    }
  }

  try {
    accessSync(OUTPUT_DIR, constants.W_OK);
  } catch {
    console.error(
      `Error: Output directory is not writable: ${OUTPUT_DIR}\n` +
        "Please check file permissions."
    );
    process.exit(1);
  }
}

async function generateStandardIcons(
  sharp: Sharp
): Promise<void> {
  for (const size of ICON_SIZES) {
    const outputPath = resolve(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE_SVG).resize(size, size).png().toFile(outputPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }
}

async function generateMaskableIcon(
  sharp: Sharp
): Promise<void> {
  const padding = Math.round(MASKABLE_SIZE * MASKABLE_PADDING_PERCENT);
  const innerSize = MASKABLE_SIZE - padding * 2;

  const outputPath = resolve(
    OUTPUT_DIR,
    `icon-maskable-${MASKABLE_SIZE}x${MASKABLE_SIZE}.png`
  );

  // Resize the source to the inner size, then extend with the background color
  // to add padding around it, keeping content within the 80% safe zone
  await sharp(SOURCE_SVG)
    .resize(innerSize, innerSize)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 9, g: 9, b: 11, alpha: 1 }, // #09090b
    })
    .png()
    .toFile(outputPath);

  console.log(`  ✓ icon-maskable-${MASKABLE_SIZE}x${MASKABLE_SIZE}.png`);
}

async function generateAppleTouchIcon(
  sharp: Sharp
): Promise<void> {
  const outputPath = resolve(OUTPUT_DIR, "apple-touch-icon.png");
  await sharp(SOURCE_SVG)
    .resize(APPLE_TOUCH_ICON_SIZE, APPLE_TOUCH_ICON_SIZE)
    .png()
    .toFile(outputPath);
  console.log(`  ✓ apple-touch-icon.png (${APPLE_TOUCH_ICON_SIZE}x${APPLE_TOUCH_ICON_SIZE})`);
}

async function main(): Promise<void> {
  console.log("Generating PWA icons from source SVG...\n");

  // Validate prerequisites
  validateSourceSvg();
  ensureOutputDirectory();

  // Load sharp (handles missing dependency error)
  const sharp = await loadSharp();

  console.log(`Source: ${SOURCE_SVG}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Generate all icon variants
  console.log("Standard icons:");
  await generateStandardIcons(sharp);

  console.log("\nMaskable icon:");
  await generateMaskableIcon(sharp);

  console.log("\nApple touch icon:");
  await generateAppleTouchIcon(sharp);

  console.log("\n✓ All icons generated successfully.");
}

main().catch((err) => {
  console.error("Unexpected error during icon generation:", err);
  process.exit(1);
});
