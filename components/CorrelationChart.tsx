"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  loggedAt: string;
  symptoms: string[];
  severity: number;
  weatherSnapshot: {
    temperature?: number | null;
    relativeHumidity?: number | null;
    pressureAltimeter?: number | null;
  } | null;
}

interface Props {
  logs: LogEntry[];
}

export function CorrelationChart({ logs }: Props) {
  const data = [...logs]
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
    .map((l) => ({
      date: format(new Date(l.loggedAt), "MMM d"),
      severity: l.severity,
      temp: l.weatherSnapshot?.temperature ?? null,
      humidity: l.weatherSnapshot?.relativeHumidity ?? null,
      pressure: l.weatherSnapshot?.pressureAltimeter
        ? Math.round(l.weatherSnapshot.pressureAltimeter * 100) / 100
        : null,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No symptom logs yet. Start logging to see correlations.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="severity"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Severity (1–5)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="temp"
          stroke="#f97316"
          strokeWidth={1.5}
          dot={false}
          name="Temp (°F)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="humidity"
          stroke="#3b82f6"
          strokeWidth={1.5}
          dot={false}
          name="Humidity (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
