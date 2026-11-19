import type {ReactNode} from "react";

export function SettingsHelp({title="자세히 보기",children}:{title?:string;children:ReactNode}){
 return <details className="text-sm text-muted-foreground">
  <summary className="cursor-pointer">{title}</summary>
  <div className="space-y-2 pt-2">{children}</div>
 </details>;
}
