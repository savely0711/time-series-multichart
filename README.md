# Time-series multichart

График на четыре time-series ряда: `area`, `spline`, `line`, `bar`. React + TypeScript + ECharts, сборка через Vite.

## Запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`.

## Как инициализировать четырьмя рядами

```tsx
import TimeSeriesChart, { SeriesConfig } from './TimeSeriesChart';

const series: SeriesConfig[] = [
  { name: 'Cost',          kind: 'area',   color: '#f2d24b', data: costData,  format: v => `$${v.toFixed(2)}` },
  { name: 'CPA',           kind: 'bar',    color: '#3b82f6', data: cpaData,   format: v => v.toFixed(2) },
  { name: 'ROI confirmed', kind: 'spline', color: '#2f7d32', data: roiData,   format: v => `${v.toFixed(2)}%` },
  { name: 'Conversions',   kind: 'line',   color: '#a832d6', data: convData,  format: v => String(Math.round(v)) },
];

<TimeSeriesChart series={series} height={440} />
```

### SeriesConfig

| Поле | Тип | Описание |
|---|---|---|
| `name` | `string` | Подпись в тултипе |
| `kind` | `'area' \| 'spline' \| 'line' \| 'bar'` | Тип отрисовки |
| `color` | `string` | Цвет линии, заливки и точки в тултипе |
| `data` | `{ date: string; value: number }[]` | Точки ряда, `date` в формате `YYYY-MM-DD` |
| `format` | `(v: number) => string` | Необязательно. Формат значения в тултипе и на оси |
| `axisIndex` | `number` | Необязательно. Если нужно посадить несколько рядов на одну ось Y |

## Решения по реализации

- **Своя ось Y на каждый ряд.** У cost, CPA, ROI и конверсий разные порядки величин. На общей оси мелкий ряд ложится в прямую по нулю, поэтому оси разведены и подписаны своим форматтером.
- **Единая ось X собирается из всех рядов.** Если у ряда нет точки на какую-то дату, туда уходит `null` и линия разрывается, а не соединяется напрямую через пропуск.
- **`spline` против `line`** отличаются только сглаживанием (`smooth: 0.45`), всё остальное одинаково.
- **Тултип по оси**, не по точке: наведение в любом месте колонки показывает все четыре значения на эту дату, заголовок в формате `DD.MM.YYYY`.
- Маркеры точек - квадраты, показываются только при наведении, как в референсе.
- Ресайз окна обрабатывается, инстанс ECharts корректно уничтожается при размонтировании.

## Что стоит доделать, если пойдёт в прод

- Зум и выбор диапазона дат (`dataZoom`), в референсе снизу видна полоса-скроллер.
- Переключение типа ряда из UI.
- Тёмная тема через палитру, вынесенную из компонента.
