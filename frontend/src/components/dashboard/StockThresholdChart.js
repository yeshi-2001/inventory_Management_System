import { useFetch } from "../../hooks/useFetch";
import { api } from "../../api";
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import SkeletonCard from "../ui/SkeletonCard";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm shadow"
      style={{ background: "#fff", border: "1px solid var(--color-teal)", color: "var(--color-navy)" }}>
      <p className="font-medium mb-1">{label}</p>
      <p>Stock: <strong>{payload[0]?.value}</strong></p>
      <p className="text-xs text-gray-400">Min: {payload[0]?.payload?.min}</p>
    </div>
  );
};

export default function StockThresholdChart() {
  const { data: inventory, loading } = useFetch(() => api.get("/inventory"));

  if (loading) return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <SkeletonCard height="h-56" />
    </div>
  );

  const data = (inventory || [])
    .slice(0, 12)
    .map((i) => ({
      name:  (i.itemName || "").slice(0, 10),
      stock: i.quantity,
      min:   i.minQuantity,
      below: i.quantity <= i.minQuantity,
    }));

  const avgMin = data.length ? Math.round(data.reduce((s, d) => s + d.min, 0) / data.length) : 0;

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--color-navy)" }}>
        Stock vs Minimum Threshold
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bg)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(111,209,215,0.08)" }} />
          <ReferenceLine
            y={avgMin} stroke="#ef4444" strokeDasharray="5 3"
            label={{ value: "Min", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
          />
          <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.below ? "#f59e0b" : "var(--color-ocean)"} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
