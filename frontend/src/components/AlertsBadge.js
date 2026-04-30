import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function AlertsBadge() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const data = await api.get("/alerts");
      setCount(Array.isArray(data) ? data.length : 0);
    } catch {
      // silently fail — badge is non-critical
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <button
      onClick={() => navigate("/alerts")}
      className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-700 transition"
      title={`${count} unresolved alert${count > 1 ? "s" : ""}`}
    >
      🔔
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
        {count > 9 ? "9+" : count}
      </span>
    </button>
  );
}
