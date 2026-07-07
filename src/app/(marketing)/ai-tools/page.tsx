import { Suspense } from "react";
import AiToolsPage from "./ai-tools-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading AI tools…</div>}>
      <AiToolsPage />
    </Suspense>
  );
}
