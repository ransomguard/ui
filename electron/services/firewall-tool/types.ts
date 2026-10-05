export type IncomingFWMessage = FWSuccessData | FWFailureData;

export interface FWSuccessData {
	success: true;
	message: string;
	ips: string[];
}

export interface FWFailureData {
	success: false;
	message: string;
}
