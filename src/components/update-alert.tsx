import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "cn";

import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";



export function UpdateAlert() {
	const { t } = useTranslation();
	const [isDownloaded, setIsDownloaded] = useState(false);
	const [version, setVersion] = useState<string | undefined>();
	const [isRestarting, setIsRestarting] = useState(false);

	useEffect(() => {
		// 메인 프로세스 메모리에 캐시된 업데이트 다운로드 상태 조회 (창을 닫거나 재오픈 시에도 유지)
		window.electronAPI?.getUpdateStatus?.().then((status) => {
			if (status?.isUpdateDownloaded) {
				setIsDownloaded(true);
				setVersion(status.version);
			}
		}).catch(() => {});

		// 실시간 다운로드 완료 이벤트 구독
		const unsub = window.electronAPI?.onUpdateStatusChanged?.((status) => {
			if (status?.isUpdateDownloaded) {
				setIsDownloaded(true);
				setVersion(status.version);
			}
		});

		return () => {
			unsub?.();
		};
	}, []);

	if (!isDownloaded) {
		return null;
	}

	const handleRestart = async () => {
		setIsRestarting(true);
		try {
			// 업데이트 체크 및 앱 재시작/신규 버전 설치 실행
			await window.electronAPI?.checkForUpdates?.();
			await window.electronAPI?.restartAndInstall?.();
		} catch (error) {
			console.error("[UpdateAlert] Failed to restart and install update:", error);
			setIsRestarting(false);
		}
	};

	return (
		<div className="px-6 pt-4">
			<Alert>
				<CheckCircle2 color="var(--primary)"/>
				<AlertTitle>
					{t(($) => $.updater.alertTitle)}
				</AlertTitle>
				<AlertDescription className="text-xs">
					{t(($) => $.updater.alertDescription, { version: version ?? "" })}
				</AlertDescription>
				<AlertAction>
					<Button
						size="sm"
						onClick={handleRestart}
						disabled={isRestarting}
					>
						<RefreshCw
							className={cn(
								"size-3.5",
								isRestarting && "animate-spin",
							)}
						/>
						{t(($) => $.updater.restartButton)}
					</Button>
				</AlertAction>
			</Alert>
		</div>
	);
}
