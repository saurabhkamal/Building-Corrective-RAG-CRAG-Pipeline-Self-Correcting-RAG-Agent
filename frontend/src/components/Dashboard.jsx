import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Logo from "./Logo";
import StatCard from "./StatCard";
import PipelineTimeline from "./PipelineTimeline";

const STREAM_URL = "http://localhost:8000/ask/stream";

const EXAMPLE_QUESTIONS = [
  "What does PCI DSS stand for, and which organizations are required to comply with it?",
  "How do PCI DSS's card data security requirements relate to a UK payment institution's obligations under the FCA's Payment Services Regulations?",
  "What is the exact interchange fee cap set by the UK Payment Systems Regulator on consumer debit card transactions?",
];

export default function Dashboard({ onLogout }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);

  async function handleAsk(e) {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSteps([]);

    try {
      const res = await fetch(STREAM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; each starts with "data: "
        const frames = buffer.split("\n\n");
        buffer = frames.pop(); // last piece may be incomplete, keep it for next chunk

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const event = JSON.parse(line.slice(5).trim());

          if (event.type === "step") {
            setSteps((prev) => [...prev, event]);
          } else if (event.type === "done") {
            setResult(event);
          }
        }
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Could not reach the API. Is the backend running on localhost:8000?"
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size={32} />
          <button
            onClick={onLogout}
            className="text-sm text-ink-400 hover:text-ink-800 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-ink-900 mb-1">
          Compliance research assistant
        </h1>
        <p className="text-sm text-ink-400 mb-8">
          Ask a question grounded in Veltra Pay's regulatory document library.
        </p>

        <form onSubmit={handleAsk} className="mb-4">
          <div className="bg-white border border-ink-100 rounded-2xl shadow-sm p-4 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the exact interchange fee cap set by the UK Payment Systems Regulator?"
              rows={3}
              className="w-full resize-none outline-none text-sm text-ink-900 placeholder:text-ink-400"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="bg-brand-500 hover:bg-brand-600 disabled:bg-ink-200 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-5 py-2 transition"
              >
                {loading ? "Thinking…" : "Ask"}
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 mb-10">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className="text-xs text-ink-600 bg-white border border-ink-100 hover:border-brand-300 hover:text-brand-600 rounded-full px-3 py-1.5 transition"
            >
              {q.length > 60 ? q.slice(0, 60) + "…" : q}
            </button>
          ))}
        </div>

        <PipelineTimeline steps={steps} running={loading} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {result && !loading && (
          <div className="space-y-6">
            <div className="bg-white border border-ink-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={result.status} />
              </div>
              <div className="text-sm text-ink-800 leading-relaxed space-y-2 [&_strong]:text-ink-900 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_em]:italic [&_a]:text-brand-600 [&_a]:underline">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Retrieval retries" value={result.retrieval_retries} />
              <StatCard label="Validation retries" value={result.validation_retries} />
              <StatCard label="Total tokens" value={result.total_tokens} />
              <StatCard label="Total time" value={`${result.total_time}s`} />
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-medium text-ink-900 mb-3">
                Retrieved chunks
              </h2>
              <div className="space-y-2">
                {result.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs border border-ink-100 rounded-lg px-3 py-2"
                  >
                    <span className="text-ink-600">
                      {doc.source} <span className="text-ink-400">p.{doc.page}</span>
                    </span>
                    <GradeBadge grade={result.document_grades[i]} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const isResolved = status === "resolved";
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        isResolved
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
    >
      {isResolved ? "Resolved" : "Unresolved"}
    </span>
  );
}

function GradeBadge({ grade }) {
  const isRelevant = grade === "relevant";
  return (
    <span
      className={`px-2 py-0.5 rounded-full font-medium ${
        isRelevant
          ? "bg-brand-50 text-brand-600"
          : "bg-ink-100 text-ink-400"
      }`}
    >
      {grade}
    </span>
  );
}
