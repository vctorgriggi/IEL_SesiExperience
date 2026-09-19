# @workspace/charts

Chart components built with Recharts. Used by the dashboard and other apps that need data visualisation.

## Components

| Component   | Export path                    | Usage in monorepo                                      |
| ----------- | ------------------------------ | ------------------------------------------------------ |
| **LineChart**  | `@workspace/charts/line-chart`  | Dashboard (`dashboard-content`, `event-analytics-card`) |
| **DonutChart** | `@workspace/charts/donut-chart` | Not yet used. Available for pie/donut visualisations (e.g. breakdowns by category, status). Props: `data`, `size`, `showLegend`, `legendPosition`, `centerContent`, `strokeWidth`, `showLegendPercent`. |
| **RadarChart** | `@workspace/charts/radar-chart` | IEL (`aderencia/radar-de-aderencia`). Polígono por série sobre eixos nomeados. `null` num valor abre o polígono naquele eixo: ausência de medida não vira mínimo da escala. Props: `data`, `series`, `domain`, `outerRadius`, `size`, `gridStroke`, `axisFill`. Sem tooltip e sem legenda embutida — quem usa explica a escala em texto. |
| **QuadrantChart** | `@workspace/charts/quadrant-chart` | IEL (`mapa-cultural/plano-cultural`). Dispersão em quatro quadrantes, com tons de peso visual por ponto. |

## Usage

```tsx
import { LineChart } from '@workspace/charts/line-chart';
import { DonutChart } from '@workspace/charts/donut-chart';
import { RadarChart } from '@workspace/charts/radar-chart';
import { QuadrantChart } from '@workspace/charts/quadrant-chart';
```

Charts stay in this package (not in `@workspace/ui`) so the UI package stays focused on layout and form primitives.
