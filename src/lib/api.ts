export type { AreaChartDataItem } from "../../electron/services/chart";
export type { BlockedIpItem } from "../../electron/services/ip-block";



export async function getMainChartData() {
	return await window.electronAPI.getMainChartData();
}

export async function getBlockedIpData() {
	return await window.electronAPI.getBlockedIpData();
}
