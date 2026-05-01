import { createContext, useContext, useState } from "react";

const DateRangeContext = createContext(null);

export function DateRangeProvider({ children }) {
  const [period, setPeriod] = useState("30");

  const getRange = () => {
    const end   = new Date();
    const start = new Date();
    const days  = period === "7" ? 7 : period === "90" ? 90 : 30;
    start.setDate(start.getDate() - days);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate:   end.toISOString().split("T")[0],
      days:      days,
    };
  };

  return (
    <DateRangeContext.Provider value={{ period, setPeriod, getRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export const useDateRange = () => useContext(DateRangeContext);
