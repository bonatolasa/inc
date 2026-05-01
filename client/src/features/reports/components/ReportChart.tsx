import React from 'react';

interface ReportChartProps {
  type: 'pie' | 'bar' | 'line';
  data: any;
}

const ReportChart: React.FC<ReportChartProps> = ({ type, data }) => {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 border border-dashed rounded-lg text-gray-400">
      <p className="text-sm">Chart Placeholder ({type})</p>
      {/* In a real scenario, implement rechart or chart.js here */}
      <pre className="hidden text-xs">{JSON.stringify(data)}</pre>
    </div>
  );
};

export default ReportChart;
