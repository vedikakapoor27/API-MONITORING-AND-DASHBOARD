// src/components/ResponseTimeChart.tsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

interface ResponseTimeData {
  timestamp: string;
  response_time: number;
  endpoint: string;
}

const ResponseTimeChart: React.FC = () => {
  const [responseData, setResponseData] = useState<ResponseTimeData[]>([]);

  useEffect(() => {
    const fetchResponseTimes = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/logs");
        setResponseData(response.data.map((log: any) => ({
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          response_time: log.response_time,
          endpoint: log.endpoint,
        })));
      } catch (error) {
        console.error("Error fetching response times:", error);
      }
    };
    fetchResponseTimes();
    const interval = setInterval(fetchResponseTimes, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: responseData.map((d) => d.timestamp),
    datasets: Object.entries(
      responseData.reduce((acc: { [key: string]: number[] }, d) => {
        acc[d.endpoint] = acc[d.endpoint] || [];
        acc[d.endpoint].push(d.response_time);
        return acc;
      }, {})
    ).map(([endpoint, data], index) => ({
      label: endpoint,
      data: data,
      fill: false,
      borderColor: `hsl(${index * 60}, 70%, 50%)`,
      tension: 0.1,
    })),
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        type: "linear",
        beginAtZero: true,
        title: {
          display: true,
          text: "Response Time (ms)",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Response Times by Endpoint",
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default ResponseTimeChart;