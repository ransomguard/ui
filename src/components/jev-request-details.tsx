import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseEvent } from "~/services/event-explanation";

export function JevRequestDetails({ raw }: { raw: string }) {
 const { i18n } = useTranslation();
 const ko = (i18n.resolvedLanguage ?? i18n.language).startsWith("ko");
 const event = parseEvent(raw);
 const data = event.data as Record<string, unknown> | undefined;
 const decision = data?.decision as Record<string, unknown> | undefined;
 const request = decision?.jevRequestState;
 const available = request !== null && typeof request === "object" && !Array.isArray(request);
 return <div className="space-y-1.5 min-w-0">
  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
   <FileText className="size-3.5 shrink-0"/>{ko ? "JEV 요청 JSON · 판단 입력 데이터" : "JEV request JSON · decision input"}
  </label>
  <p className="text-xs text-muted-foreground">{ko ? "JEV에 전달한 관측 데이터이며, 모델이 반환한 판단 이유는 아닙니다." : "Observed data sent to JEV, not a rationale returned by the model."}</p>
  <ScrollArea className="max-h-80 overflow-hidden [&_[data-slot=scroll-area-viewport]]:max-h-80 rounded-md border bg-muted/80">
   <pre className="p-3 font-mono text-[11px] whitespace-pre-wrap break-all leading-relaxed text-foreground/90">{available ? JSON.stringify(request, null, 2) : ko ? "기록 없음 · 이 사건의 JEV 요청 데이터가 저장되지 않았습니다." : "Not recorded · No JEV request data was stored for this event."}</pre>
  </ScrollArea>
 </div>;
}
