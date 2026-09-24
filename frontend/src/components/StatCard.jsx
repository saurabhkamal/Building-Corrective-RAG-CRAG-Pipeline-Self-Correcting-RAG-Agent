export default function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-ink-100 rounded-xl px-4 py-3">
      <p className="text-xs text-ink-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-ink-900">{value}</p>
    </div>
  );
}
