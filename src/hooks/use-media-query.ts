import { useSyncExternalStore } from "react";



export function useMediaQuery(query: string) {
	const mql = window.matchMedia(query);

	const subscribe = (callback: () => void) => {
		mql.addEventListener("change", callback);
		return () => mql.removeEventListener("change", callback);
	};

	const getSnapshot = () => mql.matches;
	const getServerSnapshot = () => false;

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
