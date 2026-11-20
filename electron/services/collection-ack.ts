export function collectionAckMatches(
	ack: {requestId?: unknown; pid?: unknown; collectOwnDbEvents?: unknown; error?: unknown},
	requestId: string,
	pid: number,
	collectOwnDbEvents: boolean,
) {
	return ack.requestId === requestId && ack.pid === pid
		&& ack.collectOwnDbEvents === collectOwnDbEvents && ack.error === null;
}
