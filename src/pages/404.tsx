import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";



export default function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-4 items-center justify-center text-center pt-64">
			<span className="text-7xl font-extrabold tracking-widest text-muted-foreground/40">
				404
			</span>
			<h2 className="text-3xl font-bold tracking-tight">
				{t(($) => $.notFound.title)}
			</h2>
			<div className="pt-4">
				<Button
					nativeButton={false}
					render={<Link to="/"/>}
				>
					<ArrowLeft/>
					{t(($) => $.notFound.goHome)}
				</Button>
			</div>
		</div>
	);
}
