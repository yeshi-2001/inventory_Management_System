export function Spinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function Empty({ message = "No data found." }) {
  return <p className="text-center text-gray-400 py-12">{message}</p>;
}

export function StatCard({ label, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    yellow: "bg-yellow-50 text-yellow-700",
    gray: "bg-gray-50 text-gray-700",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
    </div>
  );
}

const badgeStyles = {
  OK: "bg-green-100 text-green-700",
  Low: "bg-yellow-100 text-yellow-700",
  Urgent: "bg-red-100 text-red-700",
  Dead: "bg-gray-200 text-gray-600",
  urgent: "bg-red-100 text-red-700",
  fast_mover: "bg-blue-100 text-blue-700",
  dead_stock: "bg-gray-200 text-gray-600",
  normal: "bg-green-100 text-green-700",
};

export function Badge({ label }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeStyles[label] || "bg-gray-100"}`}>
      {label}
    </span>
  );
}
