
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ResponseTimeChart from './ResponseTimeChart';
import ErrorRateChart from './ErrorRateChart';
import RequestFlow from './RequestFlow';
import MetricCard from './MetricCard';
import PredictiveAnalytics from './PredictiveAnalytics';
import AlertSystem from './AlertSystem';
import APIMetrics from './APIMetrics';
import {
  generateTimeSeriesData,
  generateErrorDistribution,
  generateEndpointMetrics,
  generateRequestTrace,
  generateRecentAlerts,
  generatePredictionData,
  environments,
  services
} from '@/utils/mockData';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [responseTimeData, setResponseTimeData] = useState(generateTimeSeriesData());
  const [errorDistribution, setErrorDistribution] = useState(generateErrorDistribution());
  const [endpointMetrics, setEndpointMetrics] = useState(generateEndpointMetrics());
  const [requestTrace, setRequestTrace] = useState(generateRequestTrace());
  const [alerts, setAlerts] = useState(generateRecentAlerts());
  const [predictionData, setPredictionData] = useState(generatePredictionData());
  
  // Function to refresh all data
  const refreshData = useCallback(() => {
    setResponseTimeData(generateTimeSeriesData());
    setErrorDistribution(generateErrorDistribution());
    setEndpointMetrics(generateEndpointMetrics());
    setRequestTrace(generateRequestTrace());
    setPredictionData(generatePredictionData());
    
    // Add a new alert on refresh with 30% probability
    if (Math.random() > 0.7) {
      const newAlerts = generateRecentAlerts(1);
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    }
    
    toast({
      title: "Dashboard refreshed",
      description: "All metrics have been updated with latest data",
    });
    
    setRefreshTrigger(prev => prev + 1);
  }, [toast]);
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newAlerts = generateRecentAlerts(1);
        if (newAlerts[0].severity === 'critical' || newAlerts[0].severity === 'high') {
          toast({
            title: newAlerts[0].title,
            description: `${newAlerts[0].service} - ${newAlerts[0].environment}`,
            variant: "destructive",
          });
        }
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
      }
      
      if (Math.random() > 0.8) {
        setResponseTimeData(generateTimeSeriesData());
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [toast]);
  
  // Acknowledge an alert
  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged', acknowledged: true } : alert
      )
    );
    
    toast({
      title: "Alert acknowledged",
      description: "The alert has been acknowledged",
    });
  }, [toast]);
  
  // Resolve an alert
  const handleResolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved', acknowledged: true } : alert
      )
    );
    
    toast({
      title: "Alert resolved",
      description: "The alert has been resolved",
    });
  }, [toast]);
  
  // Filter the data based on selected service
  const filteredEndpointMetrics = endpointMetrics.filter(item => {
    if (filter !== 'all' && item.service !== filter) return false;
    if (environmentFilter !== 'all' && item.environment !== environmentFilter) return false;
    return true;
  });
  
  // Total endpoints, services and environments
  const totalEndpoints = filteredEndpointMetrics.length;
  const uniqueServices = new Set(filteredEndpointMetrics.map(item => item.service)).size;
  const uniqueEnvironments = new Set(filteredEndpointMetrics.map(item => item.environment)).size;
  
  // Calculate average metrics
  const avgResponseTime = filteredEndpointMetrics.reduce((sum, item) => sum + item.responseTime, 0) / (totalEndpoints || 1);
  const avgErrorRate = filteredEndpointMetrics.reduce((sum, item) => sum + item.errorRate, 0) / (totalEndpoints || 1);
  const totalRequests = filteredEndpointMetrics.reduce((sum, item) => sum + item.throughput, 0);
  
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time performance metrics and anomaly detection
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              {environments.map(env => (
                <SelectItem key={env} value={env}>{env}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refreshData}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg. Response Time"
          value={`${Math.round(avgResponseTime)}ms`}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: 3.2, isPositive: false, isUpGood: false }}
          description="Average response time across all endpoints"
          delay={0}
          variant="glass"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${(avgErrorRate * 100).toFixed(2)}%`}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          trend={{ value: 1.8, isPositive: true, isUpGood: false }}
          description="Percentage of requests resulting in errors"
          delay={100}
          variant="glass"
        />
        
        <MetricCard
          title="Total Throughput"
          value={totalRequests.toLocaleString()}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          trend={{ value: 12.5, isPositive: true, isUpGood: true }}
          description="Requests per minute"
          delay={200}
          variant="glass"
        />
        
        <MetricCard
          title="Active Endpoints"
          value={totalEndpoints}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
          description={`Across ${uniqueServices} services and ${uniqueEnvironments} environments`}
          delay={300}
          variant="glass"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResponseTimeChart
          title="API Response Times"
          data={responseTimeData}
          className="md:col-span-2"
          refreshTrigger={refreshTrigger}
        />
        
        <ErrorRateChart
          title="Error Distribution"
          data={errorDistribution}
          refreshTrigger={refreshTrigger}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PredictiveAnalytics
          title="Predictive Response Time Analysis"
          data={predictionData}
          className="lg:col-span-2"
          refreshTrigger={refreshTrigger}
        />
        
        <AlertSystem
          alerts={alerts}
          onAcknowledge={handleAcknowledgeAlert}
          onResolve={handleResolveAlert}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <APIMetrics
          data={filteredEndpointMetrics}
          refreshTrigger={refreshTrigger}
        />
        
        <RequestFlow
          data={requestTrace}
          refreshTrigger={refreshTrigger}
          onRefresh={() => setRequestTrace(generateRequestTrace())}
        />
      </div>
    </div>
  );
};

export default Dashboard;
