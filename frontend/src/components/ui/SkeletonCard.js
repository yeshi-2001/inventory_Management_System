export default function SkeletonCard({ height = "h-32", className = "" }) {
  return (
    <div
      className={`rounded-2xl ${height} ${className} skeleton`}
      style={{ background: "rgba(111,209,215,0.15)" }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-16 rounded" />
    </div>
  );
}
