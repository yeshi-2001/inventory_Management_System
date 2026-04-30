import { useState, useCallback } from "react";
import { api } from "../api";

const BASE = process.env.REACT_APP_API_URL;

export default function useAnalytics() {
  const [report,    setReport]    = useState(null);
  const [summary,   setSummary]   = useState(null);
  const [chartData, setChartData] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const buildParams = (period, startDate, endDate, itemId) => {
    const p = new URLSearchParams({ period });
    if (period === "custom") { p.set("startDate", startDate); p.set("endDate", endDate); }
    if (itemId) p.set("itemId", itemId);
    return p.toString();
  };

  const runReport = useCallback(async (period, startDate, endDate, itemId) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(period, startDate, endDate, itemId);
      // Use raw fetch so we get the full response body (data + period + skipped)
      const res  = await fetch(`${BASE}/analytics/stock-report?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Request failed");
      setReport(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.get("/analytics/summary");
      setSummary(data);
    } catch {}
  }, []);

  const fetchChartData = useCallback(async (inventoryId, startDate, endDate) => {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const data = await api.get(`/analytics/chart-data/${inventoryId}?${params}`);
      setChartData((prev) => ({ ...prev, [inventoryId]: data }));
    } catch {}
  }, []);

  const exportReport = useCallback((period, startDate, endDate, format) => {
    const params = new URLSearchParams({ period, format });
    if (period === "custom") { params.set("startDate", startDate); params.set("endDate", endDate); }
    return `${BASE}/analytics/export?${params.toString()}`;
  }, []);

  return { report, summary, chartData, loading, error, runReport, fetchSummary, fetchChartData, exportReport };
}
