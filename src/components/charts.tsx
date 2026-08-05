"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { rupiah, rupiahShort } from "@/lib/format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-08-04" -> "04 Agu" without dragging in a date library. */
function labelDate(iso: string) {
  const [, m, d] = iso.split("-");
  const month = MONTHS[Number(m) - 1] ?? "";
  return `${d} ${month}`;
}

const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "#667085", fontSize: 11 },
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0].value;
  const value = typeof raw === "number" ? (suffix ? `${raw}${suffix}` : rupiah(raw)) : String(raw ?? "");
  return (
    <div className="rounded-lg border border-gray-6 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-gray-5">
        {typeof label === "string" && label.includes("-") ? labelDate(label) : label}
      </p>
      <p className="text-sm font-semibold text-dark-1 tabular-nums">{value}</p>
    </div>
  );
}

export function RevenueAreaChart({ data }: { data: { date: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-5">Belum ada data pendapatan.</p>;
  }

  const avg = data.reduce((s, d) => s + d.total, 0) / data.length;
  // Keep the x-axis readable regardless of range length.
  const step = Math.max(1, Math.ceil(data.length / 6) - 1);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} stroke="#EAECF0" strokeDasharray="4 4" />
        <XAxis dataKey="date" {...AXIS} interval={step} tickFormatter={labelDate} dy={6} />
        <YAxis {...AXIS} width={62} tickFormatter={(v: number) => (v === 0 ? "0" : rupiahShort(v))} />

        {avg > 0 && (
          <ReferenceLine
            y={avg}
            stroke="#98A2B3"
            strokeDasharray="5 5"
            label={{ value: "rata-rata", position: "insideTopRight", fill: "#98A2B3", fontSize: 10 }}
          />
        )}

        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#D0D5DD", strokeWidth: 1 }} />

        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#revenueFill)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Vivid, distinct colour per rank — a single-hue ramp read as washed out. */
const BAR_COLORS = ["#E11D48", "#F97316", "#EAB308", "#10B981", "#0EA5E9", "#8B5CF6", "#EC4899", "#14B8A6"];

export function TopMenuBarChart({ data }: { data: { name: string; qty: number }[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-5">Belum ada penjualan.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="#EAECF0" strokeDasharray="4 4" />
        <XAxis type="number" {...AXIS} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          {...AXIS}
          width={150}
          tick={{ fill: "#344054", fontSize: 12 }}
          tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 21) + "…" : v)}
        />
        <Tooltip content={<ChartTooltip suffix="x" />} cursor={{ fill: "rgba(16,24,40,0.04)" }} />
        <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={20}>
          <LabelList dataKey="qty" position="right" className="fill-dark-1" fontSize={11} fontWeight={600} />
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
