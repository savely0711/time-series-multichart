import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/** Один тип отрисовки серии. */
export type SeriesKind = 'area' | 'spline' | 'line' | 'bar';

/** Точка ряда: дата в ISO (YYYY-MM-DD) и значение. */
export interface Point {
  date: string;
  value: number;
}

export interface SeriesConfig {
  /** Подпись в тултипе и легенде. */
  name: string;
  /** Как рисовать: area | spline | line | bar. */
  kind: SeriesKind;
  /** Цвет маркера и линии. */
  color: string;
  /** Данные ряда. */
  data: Point[];
  /** Форматирование значения в тултипе (например, доллары или проценты). */
  format?: (value: number) => string;
  /** Отдельная ось Y. По умолчанию каждая серия получает свою ось. */
  axisIndex?: number;
}

export interface TimeSeriesChartProps {
  series: SeriesConfig[];
  height?: number | string;
}

const DEFAULT_FORMAT = (v: number) => String(v);

/** DD.MM.YYYY - формат заголовка тултипа как в референсе. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Собирает единую отсортированную ось категорий из всех рядов.
 * Ряды могут иметь разную сетку дат - пропуски отдаются как null,
 * линия в этом месте разрывается, а не соединяется напрямую.
 */
function buildAxis(series: SeriesConfig[]): string[] {
  const all = new Set<string>();
  series.forEach((s) => s.data.forEach((p) => all.add(p.date)));
  return [...all].sort();
}

function toAxisValues(s: SeriesConfig, axis: string[]): (number | null)[] {
  const map = new Map(s.data.map((p) => [p.date, p.value]));
  return axis.map((d) => (map.has(d) ? (map.get(d) as number) : null));
}

/** Общие настройки маркера точки: квадрат с заливкой цветом серии. */
const MARKER = {
  symbol: 'rect' as const,
  symbolSize: 7,
  showSymbol: false,
  emphasis: { focus: 'series' as const, scale: 1.6 },
};

function buildSeries(s: SeriesConfig, axis: string[], index: number) {
  const values = toAxisValues(s, axis);
  const base = {
    id: s.name,
    name: s.name,
    yAxisIndex: s.axisIndex ?? index,
    data: values,
    color: s.color,
    connectNulls: false,
    animationDuration: 450,
  };

  if (s.kind === 'bar') {
    return {
      ...base,
      type: 'bar' as const,
      barMaxWidth: 18,
      itemStyle: { color: s.color, borderRadius: [2, 2, 0, 0] },
    };
  }

  if (s.kind === 'area') {
    return {
      ...base,
      ...MARKER,
      type: 'line' as const,
      smooth: false,
      lineStyle: { width: 1.5, color: s.color },
      itemStyle: { color: s.color },
      areaStyle: { color: s.color, opacity: 0.35 },
    };
  }

  // spline - сглаженная кривая, line - ломаная. Разница только в smooth.
  return {
    ...base,
    ...MARKER,
    type: 'line' as const,
    smooth: s.kind === 'spline' ? 0.45 : false,
    lineStyle: { width: 2, color: s.color },
    itemStyle: { color: s.color },
  };
}

export default function TimeSeriesChart({ series, height = 420 }: TimeSeriesChartProps) {
  const box = useRef<HTMLDivElement | null>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!box.current) return;
    chart.current = echarts.init(box.current);
    const onResize = () => chart.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chart.current) return;
    const axis = buildAxis(series);

    // Каждой серии своя ось Y: масштабы у cost, CPA, ROI и конверсий разные,
    // на одной оси мелкий ряд превращается в прямую по нулю.
    const yAxis = series.map((s, i) => ({
      type: 'value' as const,
      show: true,
      position: 'left' as const,
      offset: i * 46,
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: i === 0, lineStyle: { color: '#eceef2', type: 'dashed' as const } },
      axisLabel: {
        color: '#8a8f98',
        fontSize: 11,
        formatter: (v: number) => (s.format ?? DEFAULT_FORMAT)(v),
      },
    }));

    chart.current.setOption(
      {
        grid: { left: 46 * series.length + 8, right: 18, top: 24, bottom: 46 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: '#c9ccd4', width: 1 } },
          backgroundColor: '#fff',
          borderColor: '#e3e5ea',
          borderWidth: 1,
          padding: [10, 14],
          extraCssText: 'border-radius:10px;box-shadow:0 6px 24px rgba(16,20,32,.14);',
          textStyle: { color: '#1d2430', fontSize: 13 },
          formatter: (params: any[]) => {
            if (!params.length) return '';
            const head = `<div style="font-weight:500;margin-bottom:6px">${formatDate(
              params[0].axisValue,
            )}</div>`;
            const rows = params
              .filter((p) => p.value !== null && p.value !== undefined)
              .map((p) => {
                const cfg = series.find((s) => s.name === p.seriesName);
                const val = (cfg?.format ?? DEFAULT_FORMAT)(p.value as number);
                const dot = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${p.color};margin-right:8px"></span>`;
                return `<div style="display:flex;align-items:center;line-height:20px">${dot}<span style="color:#5b6270">${p.seriesName}:</span><b style="margin-left:6px">${val}</b></div>`;
              })
              .join('');
            return head + rows;
          },
        },
        legend: { show: false },
        xAxis: {
          type: 'category',
          boundaryGap: series.some((s) => s.kind === 'bar'),
          data: axis,
          axisLine: { lineStyle: { color: '#e3e5ea' } },
          axisTick: { show: false },
          axisLabel: { color: '#8a8f98', fontSize: 11, formatter: (v: string) => formatDate(v).slice(0, 5) },
        },
        yAxis,
        series: series.map((s, i) => buildSeries(s, axis, i)),
      },
      { notMerge: true },
    );
  }, [series]);

  return <div ref={box} style={{ width: '100%', height }} />;
}
