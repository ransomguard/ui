import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";



export const SVG_PATH = path.resolve(import.meta.dirname, path.join("..", "src", "assets", "logo.svg"));

export const PNG_SIZES = [16, 22, 24, 32, 48, 64, 128, 256, 512, 1024];
export const PNG_DIR = path.resolve(import.meta.dirname, path.join("..", "public", "icons"));

export const ICO_SIZES = [16, 32, 48, 64, 128, 256];
export const ICO_PATH = path.resolve(import.meta.dirname, path.join("..", "public", "Ransom0.ico"));



export interface Options {
	pngSizes?: number[];
	icoSizes?: number[];
	outDir?: string;
	svgPath?: string;
	icoPath?: string;
}

function createIcoBuffer(entries: { size: number; buffer: Buffer }[]): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // Reserved
	header.writeUInt16LE(1, 2); // Type: 1 = ICO
	header.writeUInt16LE(entries.length, 4);

	let offset = 6 + entries.length * 16;
	const dirEntries = entries.map(({ size, buffer }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size === 256 ? 0 : size, 0); // Width (0 = 256)
		entry.writeUInt8(size === 256 ? 0 : size, 1); // Height (0 = 256)
		entry.writeUInt8(0, 2); // Color palette
		entry.writeUInt8(0, 3); // Reserved
		entry.writeUInt16LE(1, 4); // Color planes
		entry.writeUInt16LE(32, 6); // Bits per pixel
		entry.writeUInt32LE(buffer.length, 8); // Image size
		entry.writeUInt32LE(offset, 12); // Image offset
		offset += buffer.length;
		return entry;
	});

	return Buffer.concat([header, ...dirEntries, ...entries.map((e) => e.buffer)]);
}

export async function main({
	outDir = PNG_DIR,
	pngSizes = PNG_SIZES,
	icoSizes = ICO_SIZES,
	svgPath = SVG_PATH,
	icoPath = ICO_PATH,
}: Options = {}) {
	if (!fs.existsSync(svgPath)) {
		console.error(`[generate-icons] No SVG file found at ${svgPath}. Please make sure the source SVG file exists.`);
		process.exit(1);
	}

	fs.mkdirSync(outDir, { recursive: true });
	fs.mkdirSync(path.dirname(icoPath), { recursive: true });

	console.log("[generate-icons] Generating PNG and ICO icons from SVG...");

	const svgBuffer = fs.readFileSync(svgPath);
	const pngSizeSet = new Set(pngSizes);
	const icoSizeSet = new Set(icoSizes.filter((s) => s <= 256));
	const allSizes = Array.from(new Set([...pngSizeSet, ...icoSizeSet])).sort((a, b) => a - b);

	const icoEntries: { size: number; buffer: Buffer }[] = [];

	await Promise.all(
		allSizes.map(async (size) => {
			const pngBuffer = await sharp(svgBuffer, { density: 300 })
				.resize(size, size)
				.png()
				.toBuffer();

			if (pngSizeSet.has(size)) {
				const outPath = path.join(outDir, `${size}x${size}.png`);
				fs.writeFileSync(outPath, pngBuffer);
			}

			if (icoSizeSet.has(size)) {
				icoEntries.push({ size, buffer: pngBuffer });
			}
		}),
	);

	console.log(`[generate-icons] Successfully generated PNG icons in ${outDir}`);

	// 크기 순 정렬 후 ICO 헤더 구성
	icoEntries.sort((a, b) => a.size - b.size);
	fs.writeFileSync(icoPath, createIcoBuffer(icoEntries));
	console.log(`[generate-icons] Successfully generated ICO icon at ${icoPath}`);
}



if (import.meta.main) {
	await main();
}
