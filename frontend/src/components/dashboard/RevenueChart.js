import { useFetch } from "../../hooks/useFetch";
import { useDateRange } from "../../context/DateRangeContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Line, defs, linearGradient, stop,
} from "recharts";
import SkeletonCard from "../ui/SkeletonCard";

const BASE = process.env.REACT_APP_API_URL;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm shadow-lg"
      style={{ background: "#fff", border: "1px solid var(--color-teal)", color: "var(--color-navy)" }}>
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === "Revenue" ? `Rs. ${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart() {
  const { period, setPeriod, getRange } = useDateRange();
  const { startDate, endDate, days } = getRange();

  const { data: rows, loading } = useFetch(() =>
    fetch(`${BASE}/billing/daily-sales?days=${days}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((r) => r.json()).then((j) => j.data || []),
    [period]
  );

  const chartData = (rows || []).map((r) => ({
    date:    r.date?.slice(5),
    Revenue: Number(r.totalRevenue || 0),
    Bills:   Number(r.totalBills   || 0),
  }));

  const PERIODS = [{ label: "7d", value: "7" }, { label: "30d", value: "30" }, { label: "90d", value: "90" }];

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>Revenue Trend</h3>
        <div className="flex gap-1">
          {PERIODS.map(({ label, value }) => (
            <button key={value} onClick={() => setPeriod(value)}
              className="px-3 py-1 text-xs rounded-full border transition"
              style={period === value
                ? { background: "var(--color-navy)", color: "#fff", borderColor: "var(--color-navy)" }
                : { background: "#fff", color: "var(--color-ocean)", borderColor: "var(--color-teal)" }
              }>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonCard height="h-56" /> : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#5DF8D8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#5DF8D8" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bg)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="Revenue"
              stroke="var(--color-ocean)" strokeWidth={2}
              fill="url(#revenueGrad)"
              activeDot={{ fill: "var(--color-mint)", stroke: "var(--color-navy)", r: 5 }}
            />
            <Area
              type="monotone" dataKey="Bills"
              stroke="var(--color-teal)" strokeWidth={1.5}
              strokeDasharray="4 4" fill="none"
              activeDot={{ fill: "var(--color-teal)", r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
