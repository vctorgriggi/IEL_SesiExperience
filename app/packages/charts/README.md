# @workspace/charts

Chart components built with Recharts. Used by the dashboard and other apps that need data visualisation.

## Components

| Component   | Export path                    | Usage in monorepo                                      |
| ----------- | ------------------------------ | ------------------------------------------------------ |
| **LineChart**  | `@workspace/charts/line-chart`  | Dashboard (`dashboard-content`, `event-analytics-card`) |
| **DonutChart** | `@workspace/charts/donut-chart` | Not yet used. Available for pie/donut visualisations (e.g. breakdowns by category, status). Props: `data`, `size`, `showLegend`, `legendPosition`, `centerContent`, `strokeWidth`, `showLegendPercent`. |

## Usage

```tsx
import { LineChart } from '@workspace/charts/line-chart';
import { DonutChart } from '@workspace/charts/donut-chart';
```

Charts stay in this package (not in `@workspace/ui`) so the UI package stays focused on layout and form primitives.
