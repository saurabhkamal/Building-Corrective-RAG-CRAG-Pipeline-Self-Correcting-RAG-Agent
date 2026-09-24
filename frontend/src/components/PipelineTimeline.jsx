const NODE_LABELS = {
  retrieve: "Retrieving documents",
  grade_documents: "Grading document relevance",
  rewrite_query: "Retrieval was weak — rewriting the search query",
  generate: "Generating answer",
  validate_answer: "Validating answer",
  mark_resolved: "Resolved",
  mark_unresolved: "Unresolved — retries exhausted",
};

export default function PipelineTimeline({ steps, running }) {
  if (steps.length === 0 && !running) return null;

  return (
    <div className="bg-white border border-ink-100 rounded-2xl shadow-sm p-6 mb-6">
      <h2 className="text-sm font-medium text-ink-900 mb-4">Pipeline progress</h2>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0">
              ✓
            </span>
            <span className="text-ink-800">
              {NODE_LABELS[step.node] ?? step.node}
            </span>
            {step.node === "rewrite_query" && (
              <span className="text-xs text-ink-400">
                → "{step.question}"
              </span>
            )}
          </div>
        ))}

        {running && (
          <div className="flex items-center gap-3 text-sm">
            <span className="w-5 h-5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin shrink-0" />
            <span className="text-ink-400">Working…</span>
          </div>
        )}
      </div>
    </div>
  );
}
