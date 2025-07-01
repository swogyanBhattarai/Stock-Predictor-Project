import { useEffect, useState, useRef } from "react";
import Plotly from "plotly.js-dist-min";

interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({ data, layout, config }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      Plotly.newPlot(chartRef.current, data, layout, config);
    }
    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [data, layout, config]);

  return <div ref={chartRef} />;
};

export default PlotlyChart;
