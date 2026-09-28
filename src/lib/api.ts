export type { AreaChartDataItem } from "~/services/chart";
export type { BlockedIpItem } from "~/services/ip-block";



export async function getMainChartData() {
	return await window.electronAPI.getMainChartData();
}

export async function getBlockedIpData() {
	return await window.electronAPI.getBlockedIpData();
}
