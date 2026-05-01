import { useFetch } from "../../hooks/useFetch";
import { api } from "../../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import SkeletonCard from "../ui/SkeletonCard";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm shadow"
      style={{ background: "#fff", border: "1px solid var(--color-teal)", color: "var(--color-navy)" }}>
      <p>{payload[0].payload.name}: <strong>{payload[0].value} units</strong></p>
    </div>
  );
};

export default function TopItemsChart() {
  const { data: items, loading } = useFetch(() => api.get("/inventory/fast-movers"));

  if (loading) return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <SkeletonCard height="h-56" />
    </div>
  );

  const data = (items || []).slice(0, 5).map((i) => ({
    name: (i.itemName || i.item_name || "").slice(0, 14),
    qty:  Math.round(i.avgDailySales || 0),
  }));

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--color-navy)" }}>Top 5 Fast Movers</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={90} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(111,209,215,0.08)" }} />
          <Bar dataKey="qty" radius={[0, 4, 4, 0]} fill="var(--color-ocean)">
            {data.map((_, i) => <Cell key={i} fill="var(--color-ocean)" />)}
            <LabelList dataKey="qty" position="right" style={{ fontSize: 11, fill: "var(--color-navy)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
