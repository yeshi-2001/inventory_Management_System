import { useFetch } from "../../hooks/useFetch";
import { api } from "../../api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SkeletonCard from "../ui/SkeletonCard";

const COLORS = {
  "In Stock":     "#3B7597",
  "Low Stock":    "#f59e0b",
  "Out of Stock": "#ef4444",
  "Dead Stock":   "#9ca3af",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm shadow"
      style={{ background: "#fff", border: "1px solid var(--color-teal)", color: "var(--color-navy)" }}>
      <p>{payload[0].name}: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

const CentreLabel = ({ cx, cy, total }) => (
  <>
    <text x={cx} y={cy - 6} textAnchor="middle" fontSize={24} fontWeight={600} fill="var(--color-navy)">{total}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fontSize={12} fill="#9ca3af">total items</text>
  </>
);

export default function StockStatusDonut() {
  const { data: inventory, loading } = useFetch(() => api.get("/inventory"));

  if (loading) return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <SkeletonCard height="h-56" />
    </div>
  );

  const items = inventory || [];
  const inStock  = items.filter((i) => i.quantity > i.minQuantity).length;
  const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity).length;
  const outStock = items.filter((i) => i.quantity === 0).length;
  const dead     = items.filter((i) => (i.dailySales || []).slice(-14).every((d) => (d.quantitySold ?? d) === 0)).length;

  const data = [
    { name: "In Stock",     value: inStock  },
    { name: "Low Stock",    value: lowStock  },
    { name: "Out of Stock", value: outStock  },
    { name: "Dead Stock",   value: dead      },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--color-navy)" }}>Stock Status</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={55} outerRadius={80}
            paddingAngle={3} dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
            <CentreLabel cx={0} cy={0} total={items.length} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ color: "#374151", fontSize: 12 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
