import { useEffect, useState } from "react";

export function DateTimeBox() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // ustaw aktualizację co minutę
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000 * 60); // co minutę

    // od razu aktualizacja przy montażu
    setNow(new Date());

    return () => clearInterval(interval);
  }, []);

  const dayName = now.toLocaleDateString("pl-PL", { weekday: "long" });
  const date = now.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
        {dayName}, {date}
      </div>
      <div style={{ fontSize: "2rem", marginTop: "0.5rem" }}>{time}</div>
    </div>
  );
}
