export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



export type StringToMsValue = `${number}${"m" | "h" | "d"}`;

/**
 * "15m", "2h", "1d" 등의 인터벌 문자열을 밀리초(ms) 단위 숫자로 변환
 */
export function stringToMs(value: StringToMsValue): number {
	const match = value.match(/^(\d+)([mhd])$/);
	if (!match) return 60 * 60 * 1000;
	const num = Number(match[1]);
	const unit = match[2];
	switch (unit) {
		case "m":
			return num * 60 * 1000;
		case "h":
			return num * 60 * 60 * 1000;
		case "d":
			return num * 24 * 60 * 60 * 1000;
		default:
			return 60 * 60 * 1000;
	}
}
