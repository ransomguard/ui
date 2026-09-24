import { useState, useEffect } from "react";



export function useIsEngineActive() {
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		const unsubscribe = window.electronAPI.onEngineStatusChanged(isActive => {
			setIsActive(isActive);
		});
		return unsubscribe;
	}, []);

	return isActive;
}
