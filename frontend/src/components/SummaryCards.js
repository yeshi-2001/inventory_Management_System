import { formatLKR } from "../utils/currency";

const cards = (summary) => [
  { label: "Urgent Items",      value: summary.urgentCount,                bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200"   },
  { label: "Low Stock Items",   value: summary.lowStockCount,              bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { label: "Dead Stock Items",  value: summary.deadStockCount,             bg: "bg-gray-50",  text: "text-gray-700",  border: "border-gray-200"  },
  { label: "Total Stock Value", value: formatLKR(summary.totalStockValue), bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
];

export default function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards(summary).map(({ label, value, bg, text, border }) => (
        <div key={label} className={`${bg} ${border} border rounded-xl p-4`}>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${text}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
