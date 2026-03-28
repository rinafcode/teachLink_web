# Quick Start Guide - Data Visualization

Get started with TeachLink's data visualization components in 5 minutes.

## Installation

All dependencies are already included in the project. No additional installation needed!

## Basic Usage

### 1. Simple Line Chart

```tsx
import { InteractiveChartLibrary } from '@/components/visualization';

export default function MyComponent() {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Students Active',
      data: [120, 145, 167, 189, 203],
      borderColor: '#3b82f6',
    }],
  };

  return <InteractiveChartLibrary data={data} chartType="line" />;
}
```

### 2. Real-Time Chart

```tsx
import { RealTimeDataVisualizer } from '@/components/visualization';

export default function LiveDashboard() {
  return (
    <RealTimeDataVisualizer
      chartType="area"
      title="Live User Activity"
      updateInterval={2000}
    />
  );
}
```

### 3. Custom Chart Builder

```tsx
import { CustomVisualizationBuilder } from '@/components/visualization';

export default function ChartBuilder() {
  return (
    <CustomVisualizationBuilder
      onSave={(config) => {
        console.log('Chart saved:', config);
        // Save to your backend
      }}
    />
  );
}
```

### 4. Data Explorer

```tsx
import { DataExplorationTools } from '@/components/visualization';

export default function Analytics() {
  const analyticsData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Course Completions',
      data: [45, 52, 68, 74],
      backgroundColor: '#10b981',
    }],
  };

  return <DataExplorationTools data={analyticsData} />;
}
```

## Common Patterns

### Multiple Datasets

```tsx
const data = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    {
      label: 'Completions',
      data: [65, 78, 90],
      borderColor: '#3b82f6',
    },
    {
      label: 'Enrollments',
      data: [45, 52, 68],
      borderColor: '#8b5cf6',
    },
  ],
};
```

### With Click Handler

```tsx
<InteractiveChartLibrary
  data={data}
  chartType="bar"
  onDataPointClick={(point) => {
    console.log('Clicked:', point);
    // Navigate to details page
  }}
/>
```

### Export Data

```tsx
import { useDataVisualization } from '@/hooks/useDataVisualization';

function MyChart() {
  const { data, exportData } = useDataVisualization({ initialData: myData });

  return (
    <div>
      <button onClick={() => exportData('csv', 'my-data')}>
        Export CSV
      </button>
      <InteractiveChartLibrary data={data} chartType="line" />
    </div>
  );
}
```

## Chart Types

| Type | Best For | Example |
|------|----------|---------|
| `line` | Trends over time | Student progress |
| `bar` | Comparisons | Course enrollments |
| `area` | Volume over time | Active users |
| `pie` | Proportions | Course categories |
| `scatter` | Correlations | Grade vs. time spent |
| `radar` | Multi-dimensional | Skill assessments |

## Styling

### Custom Colors

```tsx
const data = {
  labels: ['A', 'B', 'C'],
  datasets: [{
    label: 'My Data',
    data: [10, 20, 30],
    backgroundColor: '#ff6384',  // Custom color
    borderColor: '#ff6384',
    borderWidth: 2,
  }],
};
```

### Dark Mode

All components automatically support dark mode through Tailwind CSS.

## Utilities

### Format Numbers

```tsx
import { formatNumber, formatPercentage } from '@/utils/visualizationUtils';

formatNumber(1500);      // "1.5K"
formatNumber(1500000);   // "1.5M"
formatPercentage(45.67); // "45.7%"
```

### Calculate Statistics

```tsx
import { calculateStatistics } from '@/utils/visualizationUtils';

const stats = calculateStatistics([10, 20, 30, 40, 50]);
// { mean: 30, median: 30, min: 10, max: 50, stdDev: 14.14 }
```

### Generate Sample Data

```tsx
import { generateSampleData } from '@/utils/visualizationUtils';

const data = generateSampleData(10, 0, 100); // 10 random values between 0-100
```

## Tips

1. **Performance**: Keep data points under 50 for real-time charts
2. **Colors**: Use the built-in color palette for consistency
3. **Accessibility**: Always provide meaningful titles
4. **Responsive**: Test on mobile devices
5. **Export**: Offer CSV/JSON export for power users

## Demo

Visit `/visualization-demo` to see all components in action!

## Need Help?

- 📖 Full documentation: `src/components/visualization/README.md`
- 🧪 Tests: `src/utils/__tests__/visualizationUtils.test.ts`
- 💡 Examples: `src/app/visualization-demo/page.tsx`

## Next Steps

1. Check out the full README for advanced features
2. Explore the demo page for more examples
3. Read the implementation guide for architecture details
4. Start building your own visualizations!

Happy visualizing! 📊
