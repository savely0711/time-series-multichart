import TimeSeriesChart, { SeriesConfig } from './TimeSeriesChart';

/** Демо-данные: четыре ряда за две недели июня. */
function ramp(start: string, days: number, fn: (i: number) => number) {
  const base = new Date(start + 'T00:00:00Z');
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base.getTime() + i * 86400000);
    return { date: d.toISOString().slice(0, 10), value: Number(fn(i).toFixed(2)) };
  });
}

const series: SeriesConfig[] = [
  {
    name: 'Cost',
    kind: 'area',
    color: '#f2d24b',
    data: ramp('2026-06-05', 14, (i) => 20 + i * 2.4 + Math.sin(i) * 6),
    format: (v) => `$${v.toFixed(2)}`,
  },
  {
    name: 'CPA',
    kind: 'bar',
    color: '#3b82f6',
    data: ramp('2026-06-05', 14, (i) => 0.8 + Math.abs(Math.cos(i / 2)) * 1.1),
    format: (v) => v.toFixed(2),
  },
  {
    name: 'ROI confirmed',
    kind: 'spline',
    color: '#2f7d32',
    data: ramp('2026-06-05', 14, (i) => 180 - i * 9 + Math.pow(i - 7, 2) * 2.6),
    format: (v) => `${v.toFixed(2)}%`,
  },
  {
    name: 'Conversions',
    kind: 'line',
    color: '#a832d6',
    data: ramp('2026-06-05', 14, (i) => 4 + i * 2.3),
    format: (v) => String(Math.round(v)),
  },
];

export default function App() {
  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18, color: '#1d2430', marginBottom: 16 }}>Time-series multichart</h1>
      <TimeSeriesChart series={series} height={440} />
    </div>
  );
}
