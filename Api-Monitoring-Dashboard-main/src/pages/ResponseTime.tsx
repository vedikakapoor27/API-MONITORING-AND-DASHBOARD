import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/Layout';
import ResponseTimeChart from '@/components/ResponseTimeChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricCard from '@/components/MetricCard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, BarChart3, RefreshCw, Filter, ChevronRight, ZoomIn, Timer, Zap } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Annotation } from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

interface LogEntry {
  timestamp: string;
  response_time: number;
  endpoint: string;
  environment: string;
  isAnomaly?: boolean;
}

interface Alert {
  timestamp: string;
  endpoint: string;
  environment: string;
  alert_types: string[];
  metrics: { response_time: number; error: number };
  severity: string;
  status: string;
}

interface Prediction {
  timestamp: string;
  predicted_response_time: number;
}

const ResponseTimePage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [responseTimeData, setResponseTimeData] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [services, setServices] = useState<string[]>([]);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const chartRef = useRef<ChartJS>(null);

  // Fetch logs, alerts, and predictions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch logs
        const logsResponse = await axios.get('http://localhost:8000/api/logs');
        const logs = logsResponse.data;

        // Fetch alerts
        const alertsResponse = await axios.get('http://localhost:8000/api/alerts');
        const fetchedAlerts = alertsResponse.data;
        setAlerts(fetchedAlerts);
        console.log("Fetched Alerts:", fetchedAlerts);

        // Process logs and mark anomalies
        const data = logs.map((log: any) => {
          const logTimestamp = new Date(log.timestamp).toISOString().slice(0, 16);
          const matchingAlert = fetchedAlerts.find((alert: Alert) => {
            const alertTimestamp = new Date(alert.timestamp).toISOString().slice(0, 16);
            return (
              alertTimestamp === logTimestamp &&
              alert.endpoint === log.endpoint &&
              alert.environment === log.environment &&
              alert.metrics.response_time === log.response_time
            );
          });

          return {
            timestamp: new Date(log.timestamp).toLocaleTimeString(),
            response_time: log.response_time || 0,
            endpoint: log.endpoint,
            environment: log.environment,
            isAnomaly: !!matchingAlert,
          };
        });

        console.log("Processed Response Time Data with Anomalies:", data);
        setResponseTimeData(data);

        // Extract unique services and environments
        const uniqueServices = ['all', ...new Set(data.map((item: LogEntry) => item.endpoint))];
        const uniqueEnvironments = ['all', ...new Set(data.map((item: LogEntry) => item.environment))];
        setServices(uniqueServices);
        setEnvironments(uniqueEnvironments);
        console.log("Unique Services:", uniqueServices);
        console.log("Unique Environments:", uniqueEnvironments);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load response time data or alerts.',
          variant: 'destructive',
        });
      }
    };

    const fetchPredictions = async () => {
      setLoadingPredictions(true);
      try {
        const response = await axios.get('http://localhost:8000/api/predict');
        const data = response.data.map((pred: any) => ({
          timestamp: new Date(pred.timestamp).toLocaleString(),
          predicted_response_time: pred.predicted_response_time || 0,
        }));
        console.log("Fetched Predictions:", data);
        setPredictions(data);
      } catch (error) {
        console.error('Error fetching predictions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load predictions. Check backend setup.',
          variant: 'destructive',
        });
        setPredictions([]); // Fallback to empty array
      } finally {
        setLoadingPredictions(false);
      }
    };

    fetchData();
    fetchPredictions();

    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchData();
      fetchPredictions();
    }, 5000);
    return () => clearInterval(interval);
  }, [toast]);

  // Filter data based on selected service and environment
  const filteredData = responseTimeData.filter(item => {
    const serviceMatch = selectedService === 'all' || item.endpoint === selectedService;
    const envMatch = selectedEnvironment === 'all' || item.environment === selectedEnvironment;
    return serviceMatch && envMatch;
  });
  console.log("Filtered Data:", filteredData);

  // Stats calculations
  const avgResponseTime = Math.round(
    filteredData.reduce((sum, item) => sum + item.response_time, 0) / (filteredData.length || 1)
  );
  
  const p95ResponseTime = Math.round(
    [...filteredData]
      .sort((a, b) => a.response_time - b.response_time)
      [Math.floor(filteredData.length * 0.95)]?.response_time || 0
  );
  
  const maxResponseTime = Math.max(...filteredData.map(item => item.response_time), 0);
  
  const anomaliesCount = filteredData.filter(item => item.isAnomaly).length;

  // Predicted anomalies count
  const predictedAnomaliesCount = predictions.filter(pred => pred.predicted_response_time > 200).length;
  console.log("Predicted Anomalies Count:", predictedAnomaliesCount);

  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Response time data refreshed',
      description: 'The latest data has been loaded',
    });
  }, [toast]);

  // Navigate to details page
  const handleViewDetails = () => {
    navigate('/response-time-details', {
      state: {
        data: filteredData,
        selectedService,
        selectedEnvironment,
        avgResponseTime,
        p95ResponseTime,
        maxResponseTime,
        anomaliesCount,
      },
    });
    toast({
      title: 'Navigating to Details',
      description: 'Viewing detailed response time analysis.',
    });
  };

  // Chart data for predicted response times and anomalies
  const anomalyThreshold = 200;
  const predictedChartData = {
    labels: predictions.map(pred => pred.timestamp),
    datasets: [
      {
        label: 'Predicted Response Time (ms)',
        data: predictions.map(pred => pred.predicted_response_time),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointBackgroundColor: predictions.map(pred => 
          pred.predicted_response_time > anomalyThreshold ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
        ),
        pointRadius: 4,
        fill: false,
      },
    ],
  };

  const predictedChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Predicted Response Times (Next 24 Hours)' },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}ms`,
        },
      },
      annotation: {
        annotations: {
          thresholdLine: {
            type: 'line',
            yMin: anomalyThreshold,
            yMax: anomalyThreshold,
            borderColor: 'rgba(255, 165, 0, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: 'Anomaly Threshold (200ms)',
              enabled: true,
              position: 'end',
              backgroundColor: 'rgba(255, 165, 0, 0.8)',
              yAdjust: -10,
            },
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Response Time (ms)' },
        suggestedMin: 0,
        suggestedMax: Math.max(...predictions.map(pred => pred.predicted_response_time), anomalyThreshold * 1.2),
      },
      x: {
        title: { display: true, text: 'Time' },
      },
    },
  };

  return (
    <Layout>
      <div className="space-y-6 pb-10">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-xl border border-blue-100 dark:border-blue-900 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Response Time Analysis
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Monitor and analyze API response times across services
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="bg-white dark:bg-card/80 p-1 rounded-lg shadow-sm border flex space-x-1">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-[180px] border-0 bg-transparent">
                    <div className="flex items-center">
                      <Filter className="h-3.5 w-3.5 mr-2 text-blue-500" />
                      <SelectValue placeholder="Filter by service" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                  <SelectTrigger className="w-[180px] border-0 bg-transparent">
                    <div className="flex items-center">
                      <Filter className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                      <SelectValue placeholder="Filter by environment" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map(env => (
                      <SelectItem key={env} value={env}>{env}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="ghost" onClick={refreshData} size="sm" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50">
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Avg. Response Time"
            value={`${avgResponseTime}ms`}
            icon={<Timer className="h-5 w-5 text-blue-500" />}
            trend={{ value: 3.2, isPositive: false, isUpGood: false }}
            description="Average response time across all endpoints"
            delay={0}
            variant="glass"
            className="border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20"
          />
          
          <MetricCard
            title="P95 Response Time"
            value={`${p95ResponseTime}ms`}
            icon={<BarChart3 className="h-5 w-5 text-indigo-500" />}
            trend={{ value: 2.5, isPositive: false, isUpGood: false }}
            description="95th percentile response time"
            delay={100}
            variant="glass"
            className="border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20"
          />
          
          <MetricCard
            title="Max Response Time"
            value={`${maxResponseTime}ms`}
            icon={<Zap className="h-5 w-5 text-violet-500" />}
            trend={{ value: 5.8, isPositive: false, isUpGood: false }}
            description="Maximum response time detected"
            delay={200}
            variant="glass"
            className="border-violet-100 dark:border-violet-900 bg-gradient-to-br from-violet-50/80 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20"
          />
          
          <MetricCard
            title="Anomalies Detected"
            value={anomaliesCount.toString()}
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            description="Unusual response time patterns (historical)"
            delay={300}
            variant="glass"
            className="border-amber-100 dark:border-amber-900 bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20"
          />
          
          <MetricCard
            title="Predicted Anomalies"
            value={predictedAnomaliesCount.toString()}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            description="Predicted anomalies (next 24 hours)"
            delay={400}
            variant="glass"
            className="border-red-100 dark:border-red-900 bg-gradient-to-br from-red-50/80 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-blue-100 dark:border-blue-900 overflow-hidden rounded-xl shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center">
                  <ZoomIn className="h-4 w-4 mr-2 text-blue-500" />
                  API Response Times
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={handleViewDetails} className="text-xs text-blue-600 dark:text-blue-400">
                  View Details
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ResponseTimeChart
                title=""
                data={filteredData}
                refreshTrigger={refreshTrigger}
                timeRanges={['1h', '24h', '7d', '30d']}
                showAnomalies={true}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-indigo-100 dark:border-indigo-900 overflow-hidden rounded-xl shadow-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b border-indigo-100 dark:border-indigo-900">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-indigo-500" />
                    Response Time by Service
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ResponseTimeChart
                  title=""
                  data={filteredData}
                  refreshTrigger={refreshTrigger}
                  showAnomalies={false}
                  className="border-0 shadow-none"
                />
              </CardContent>
            </Card>
            
            <Card className="border-violet-100 dark:border-violet-900 overflow-hidden rounded-xl shadow-sm">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-b border-violet-100 dark:border-violet-900">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-violet-500" />
                    Response Time by Environment
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ResponseTimeChart
                  title=""
                  data={filteredData}
                  refreshTrigger={refreshTrigger}
                  showAnomalies={false}
                  className="border-0 shadow-none"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-yellow-100 dark:border-yellow-900 overflow-hidden rounded-xl shadow-sm">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-b border-yellow-100 dark:border-yellow-900">
              <CardTitle className="text-base font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                Predicted Response Times (Next 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPredictions ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin h-5 w-5 border-4 border-t-4 border-blue-500 rounded-full"></div>
                  <span className="ml-2 text-gray-500">Loading predictions...</span>
                </div>
              ) : predictions.length > 0 ? (
                <div className="h-100">
                  <Line
                    ref={chartRef}
                    data={predictedChartData}
                    options={predictedChartOptions}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500">No predictions available. Check backend setup.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ResponseTimePage;