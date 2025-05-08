import { useEffect, useState } from 'react';

const PlotlyChart = () => {
  const [chartHtml, setChartHtml] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the candlestick chart HTML from the backend
    const fetchChartHtml = async () => {
      try {
        const response = await fetch('/api/chart-html');
        if (response.ok) {
          const data = await response.json();
          setChartHtml(data.html);  // Set the HTML for the chart
        } else {
          console.error('Error fetching chart data');
        }
      } catch (error) {
        console.error('Error fetching chart HTML:', error);
      }
    };

    fetchChartHtml();
  }, []);  // Only run once on component mount

  if (!chartHtml) {
    return <div>Loading chart...</div>;  // Loading message while waiting for the chart HTML
  }

  return (
    <div
      className="chart-container"
      dangerouslySetInnerHTML={{ __html: chartHtml }}  // Render the Plotly chart HTML
    />
  );
};

export default PlotlyChart;
