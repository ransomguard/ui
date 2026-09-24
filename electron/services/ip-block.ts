function randomString(length = 8): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}



export interface BlockedIpItem {
	id: string;
	ipAddress: string;
	reason: string;
	type: "manual" | "automatic";
	blockedAt: string;
}

export async function fetchBlockedIpData(): Promise<BlockedIpItem[]> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const reasons = [
		"무차별 대입 공격 (Brute-force) 감지",
		"랜섬웨어 의심 시그니처 패킷 전송",
		"관리자 수동 차단 지정",
		"이상 세션 반복 요청",
		"의심스러운 외부 스캔 시도",
		"C2 서버 악성 통신 시도",
		"비정상 암호화 파일 전송 감지",
		"포트 스캐닝 행위 차단",
	];

	return Array.from({ length: 37 }).map((_, index) => {
		const ip1 = (index % 4 === 0) ? 192 : (index % 3 === 0) ? 10 : (index % 2 === 0) ? 172 : 203;
		const ip2 = (index * 7) % 250 + 1;
		const ip3 = (index * 13) % 250 + 1;
		const ip4 = (index * 19 + 5) % 250 + 1;
		const isManual = index % 3 === 2;
		const reason = isManual ? "관리자 수동 차단 지정" : reasons[index % reasons.length]!;

		const dayNum = Math.max(1, 22 - Math.floor(index / 2));
		const day = String(dayNum).padStart(2, "0");
		const hour = String((23 - index) % 24 < 0 ? 24 + (23 - index) % 24 : (23 - index) % 24).padStart(2, "0");
		const min = String((index * 17) % 60).padStart(2, "0");
		const sec = String((index * 29) % 60).padStart(2, "0");

		return {
			id: randomString(),
			ipAddress: `${ip1}.${ip2}.${ip3}.${ip4}`,
			reason,
			type: isManual ? ("manual" as const) : ("automatic" as const),
			blockedAt: `2026-09-${day} ${hour}:${min}:${sec}`,
		};
	});
}
