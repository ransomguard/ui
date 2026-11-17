import { useTranslation } from "react-i18next";
import { explainEvent } from "~/services/event-explanation";

export function EventExplanation({ raw }: { raw: string }) {
	const { i18n } = useTranslation();
	const explanation = explainEvent(raw, i18n.resolvedLanguage ?? i18n.language);
	return (
		<section className="space-y-2 min-w-0" aria-label={explanation.title}>
			<h3 className="text-xs font-semibold">{explanation.title}</h3>
			<dl className="space-y-3 rounded-md border bg-muted/50 p-3 text-xs">
				{explanation.rows.map(row => (
					<div key={row.label} className="min-w-0">
						<dt className="text-muted-foreground">{row.label}</dt>
						<dd className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{row.value}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}
