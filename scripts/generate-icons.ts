import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";



export const SIZES = [16, 22, 24, 32, 48, 64, 128, 256, 512, 1024];
export const SVG_PATH = path.resolve(import.meta.dirname, path.join("..", "src", "assets", "logo.svg"));
export const OUT_DIR = path.resolve(import.meta.dirname, path.join("..", "public", "icons"));



export interface Options {
	sizes?: number[];
	outDir?: string;
	svgPath?: string;
}

export async function main({
	outDir = OUT_DIR,
	sizes = SIZES,
	svgPath = SVG_PATH,
}: Options = {}) {
	if (!fs.existsSync(svgPath)) {
		console.error(`[generate-icons] No SVG file found at ${svgPath}. Please make sure the source SVG file exists.`);
		process.exit(1);
	}

	fs.mkdirSync(outDir, { recursive: true });

	console.log("[generate-icons] Generating PNG icons from SVG...");

	const svgBuffer = fs.readFileSync(svgPath);

	await Promise.all(
		sizes.map(async (size) => {
			const outPath = path.join(outDir, `${size}x${size}.png`);
			await sharp(svgBuffer, { density: 300 })
				.resize(size, size)
				.png()
				.toFile(outPath);
		}),
	);

	console.log(`[generate-icons] Successfully generated PNG icons in ${outDir}`);

}



if (import.meta.main) {
	await main();
}
