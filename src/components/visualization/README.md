# Data Visualization Components

Comprehensive data visualization library with interactive charts, real-time updates, and custom visualization tools for the TeachLink platform.

## Features

- 📊 **Multiple Chart Types**: Line, Bar, Area, Pie, Doughnut, Scatter, and Radar charts
- ⚡ **Real-Time Updates**: WebSocket support for live data visualization
- 🎨 **Custom Builder**: User-friendly interface for creating custom charts
- 🔍 **Data Exploration**: Interactive tools for data analysis and filtering
- 📈 **Statistical Analysis**: Built-in calculations for mean, median, mode, and standard deviation
- 💾 **Export Capabilities**: Export data to CSV and JSON formats
- 🌙 **Dark Mode**: Full support for light and dark themes
- 📱 **Responsive Design**: Works seamlessly on all device sizes
- ♿ **Accessible**: WCAG-compliant with keyboard navigation and screen reader support

## Components

### 1. InteractiveChartLibrary

A comprehensive chart library supporting multiple visualization types with interactive features.

```tsx
import { InteractiveChartLibrary } from '@/components/visualization';

const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      label: 'Sales',
      data: [65, 59, 80, 81, 56],
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
    },
  ],
};

<InteractiveChartLibrary
  data={data}
  chartType="line"
  title="Monthly Sales"
  height={400}
  showLegend={true}
  showGrid={true}
  animated={true}
  onDataPointClick={(data) => console.log(data)}
/>;
```

**Props:**

- `data`: ChartData - Chart data with labels and datasets
- `chartType`: ChartType - Type of chart ('line', 'bar', 'area', 'pie', 'doughnut', 'scatter', 'radar')
- `title?`: string - Chart title
- `height?`: number - Chart height in pixels (default: 400)
- `showLegend?`: boolean - Show/hide legend (default: true)
- `showGrid?`: boolean - Show/hide grid lines (default: true)
- `animated?`: boolean - Enable/disable animations (default: true)
- `onDataPointClick?`: (data: any) => void - Callback for data point clicks
- `className?`: string - Additional CSS classes

### 2. RealTimeDataVisualizer

Live data visualization with WebSocket support and automatic updates.

```tsx
import { RealTimeDataVisualizer } from '@/components/visualization';

<RealTimeDataVisualizer
  websocketUrl="wss://api.example.com/data"
  chartType="line"
  title="Live User Activity"
  updateInterval={2000}
  maxDataPoints={20}
/>;
```

**Props:**

- `websocketUrl?`: string - WebSocket URL for real-time data
- `chartType?`: ChartType - Type of chart (default: 'line')
- `title?`: string - Chart title (default: 'Real-Time Data')
- `updateInterval?`: number - Update interval in ms (default: 2000)
- `maxDataPoints?`: number - Maximum data points to display (default: 20)
- `className?`: string - Additional CSS classes

**Features:**

- Real-time data streaming via WebSocket
- Automatic data simulation when WebSocket is unavailable
- Pause/resume functionality
- Live statistics (mean, median, trend)
- Connection status indicator

### 3. CustomVisualizationBuilder

Interactive chart builder for creating custom visualizations.

```tsx
import { CustomVisualizationBuilder } from '@/components/visualization';

<CustomVisualizationBuilder
  onSave={(config) => {
    console.log('Chart saved:', config);
  }}
/>;
```

**Props:**

- `onSave?`: (config: { data: ChartData; chartType: ChartType; title: string }) => void - Save callback
- `className?`: string - Additional CSS classes

**Features:**

- Add/remove labels and datasets
- Edit data values in real-time
- Change chart type dynamically
- Live preview of changes
- Export configuration to JSON
- Color-coded datasets

### 4. DataExplorationTools

Interactive data analysis tools with filtering and statistics.

```tsx
import { DataExplorationTools } from '@/components/visualization';

const data = {
  labels: ['Day 1', 'Day 2', 'Day 3', ...],
  datasets: [
    {
      label: 'Active Users',
      data: [120, 145, 167, ...],
      backgroundColor: '#10b981',
      borderColor: '#10b981',
    },
  ],
};

<DataExplorationTools
  data={data}
  title="Analytics Dashboard"
/>
```

**Props:**

- `data`: ChartData - Data to explore
- `title?`: string - Dashboard title (default: 'Data Exploration')
- `className?`: string - Additional CSS classes

**Features:**

- Time range filtering (7d, 30d, 90d, 1y, all)
- Chart type switching
- Dataset selection
- Statistical analysis (mean, median, mode, min, max, std dev)
- Export to CSV/JSON
- Interactive data table
- Responsive statistics cards

## Hooks

### useDataVisualization

Custom hook for managing visualization state and real-time updates.

```tsx
import { useDataVisualization } from '@/hooks/useDataVisualization';

const {
  data,
  config,
  isLoading,
  error,
  isConnected,
  updateData,
  updateConfig,
  refreshData,
  exportData,
  addDataPoint,
  removeDataPoint,
  clearData,
  calculateStats,
} = useDataVisualization({
  initialData: myData,
  config: {
    chartType: 'line',
    realTimeEnabled: true,
  },
  websocketUrl: 'wss://api.example.com/data',
  autoRefresh: true,
  refreshInterval: 30000,
});
```

**Options:**

- `initialData?`: ChartData - Initial chart data
- `config?`: Partial<VisualizationConfig> - Initial configuration
- `websocketUrl?`: string - WebSocket URL for real-time updates
- `autoRefresh?`: boolean - Enable automatic data refresh
- `refreshInterval?`: number - Refresh interval in ms

**Returns:**

- `data`: ChartData | null - Current chart data
- `config`: VisualizationConfig - Current configuration
- `isLoading`: boolean - Loading state
- `error`: string | null - Error message
- `isConnected`: boolean - WebSocket connection status
- `updateData`: (newData: ChartData) => void - Update chart data
- `updateConfig`: (newConfig: Partial<VisualizationConfig>) => void - Update configuration
- `refreshData`: () => Promise<void> - Manually refresh data
- `exportData`: (format: 'csv' | 'json', filename: string) => void - Export data
- `addDataPoint`: (datasetIndex: number, value: number, label?: string) => void - Add data point
- `removeDataPoint`: (datasetIndex: number, index: number) => void - Remove data point
- `clearData`: () => void - Clear all data
- `calculateStats`: () => Statistics | null - Calculate statistics

## Utilities

### visualizationUtils

Helper functions for data transformation and formatting.

```tsx
import {
  formatNumber,
  formatPercentage,
  generateDateLabels,
  aggregateByTimePeriod,
  calculateMovingAverage,
  normalizeData,
  calculateTrend,
  calculateStatistics,
  exportToCSV,
  exportToJSON,
  generateSampleData,
} from '@/utils/visualizationUtils';

// Format numbers
formatNumber(1500); // "1.5K"
formatNumber(1500000); // "1.5M"

// Format percentages
formatPercentage(45.678); // "45.7%"

// Generate date labels
const labels = generateDateLabels('7d'); // Last 7 days

// Calculate moving average
const ma = calculateMovingAverage([10, 20, 30, 40], 3);

// Normalize data
const normalized = normalizeData([10, 50, 90]); // [0, 50, 100]

// Calculate trend
const trend = calculateTrend([100, 110, 120]); // { direction: 'up', percentage: 20 }

// Calculate statistics
const stats = calculateStatistics([10, 20, 30, 40, 50]);
// { mean: 30, median: 30, mode: 10, min: 10, max: 50, stdDev: 14.14 }

// Export data
exportToCSV(chartData, 'my-data');
exportToJSON(chartData, 'my-data');

// Generate sample data
const sampleData = generateSampleData(10, 0, 100);
```

## Demo Page

Visit `/visualization-demo` to see all components in action with interactive examples.

## Installation

The visualization components use the following dependencies (already included):

```json
{
  "recharts": "^2.15.4",
  "socket.io-client": "^4.8.3",
  "lucide-react": "^0.462.0"
}
```

## Usage Examples

### Educational Analytics Dashboard

```tsx
import { DataExplorationTools } from '@/components/visualization';

const courseData = {
  labels: generateDateLabels('30d'),
  datasets: [
    {
      label: 'Course Completions',
      data: [
        /* completion data */
      ],
      backgroundColor: '#3b82f6',
    },
    {
      label: 'Active Students',
      data: [
        /* student data */
      ],
      backgroundColor: '#10b981',
    },
  ],
};

<DataExplorationTools data={courseData} title="Course Analytics" />;
```

### Live Student Activity Monitor

```tsx
import { RealTimeDataVisualizer } from '@/components/visualization';

<RealTimeDataVisualizer
  websocketUrl="wss://api.teachlink.com/activity"
  chartType="area"
  title="Live Student Activity"
  updateInterval={1000}
  maxDataPoints={30}
/>;
```

### Custom Report Builder

```tsx
import { CustomVisualizationBuilder } from '@/components/visualization';

<CustomVisualizationBuilder
  onSave={(config) => {
    // Save to database or local storage
    saveReport(config);
  }}
/>;
```

## Best Practices

1. **Performance**: Limit real-time data points to 50 or fewer for optimal performance
2. **Accessibility**: Always provide meaningful titles and labels for screen readers
3. **Colors**: Use the provided color palette for consistency
4. **Data Size**: For large datasets, use data aggregation and pagination
5. **Export**: Provide export options for users who need raw data
6. **Responsive**: Test visualizations on different screen sizes
7. **Error Handling**: Always handle loading and error states gracefully

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## Contributing

When adding new chart types or features:

1. Update the `ChartType` type in `visualizationUtils.ts`
2. Add rendering logic to `InteractiveChartLibrary.tsx`
3. Write tests for new utilities
4. Update this README with examples
5. Add demo to the visualization demo page

## License

Part of the TeachLink platform. See main project LICENSE for details.
