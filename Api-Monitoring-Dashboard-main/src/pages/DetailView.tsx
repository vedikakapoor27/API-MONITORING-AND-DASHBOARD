
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import ResponseTimeChart from '@/components/ResponseTimeChart';
import ErrorRateChart from '@/components/ErrorRateChart';
import RequestFlow from '@/components/RequestFlow';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';
import MetricCard from '@/components/MetricCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  generateTimeSeriesData,
  generateErrorDistribution,
  generateRequestTrace,
  generatePredictionData,
  services,
  environments,
  endpoints,
  randomItem,
  randomInRange
} from '@/utils/mockData';

const DetailView: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  
  // Generate mock data based on the page type
  const responseTimeData = generateTimeSeriesData();
  const errorDistribution = generateErrorDistribution();
  const requestTraces = Array(5).fill(0).map(() => generateRequestTrace());
  const predictionData = generatePredictionData();
  
  // Mock entity data
  const entityData = {
    name: id || 'Unknown',
    type: type || 'service',
    environment: randomItem(environments),
    status: Math.random() > 0.7 ? 'degraded' : 'healthy',
    responseTime: randomInRange(50, 1000),
    errorRate: randomInRange(0, 10) / 100,
    throughput: randomInRange(100, 10000),
    availability: randomInRange(90, 100) / 100,
    lastDeployed: '2 days ago',
    version: '1.5.2',
    dependencies: Array(randomInRange(2, 5)).fill(0).map(() => randomItem(services)),
    endpoints: Array(randomInRange(3, 8)).fill(0).map(() => randomItem(endpoints))
  };
  
  return (
    <Layout>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>API Monitoring</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="capitalize">{type}s</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{id}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{entityData.name}</h1>
            <Badge variant={entityData.status === 'healthy' ? 'outline' : 'destructive'} className="mt-1">
              {entityData.status === 'healthy' ? (
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-success mr-1.5"></span>
                  Healthy
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-destructive mr-1.5 animate-pulse"></span>
                  Degraded
                </span>
              )}
            </Badge>
          </div>
          
          <p className="text-muted-foreground mt-1">
            {type === 'service' 
              ? 'Service metrics and performance analysis' 
              : type === 'endpoint' 
                ? 'Endpoint metrics and request analysis'
                : 'Environment overview and health status'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Configure Alerts
          </Button>
          
          <Button variant="outline" size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data
          </Button>
          
          <Button size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Run Health Check
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Response Time"
          value={`${entityData.responseTime}ms`}
          trend={{ value: 3.2, isPositive: false, isUpGood: false }}
          variant="glass"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${(entityData.errorRate * 100).toFixed(2)}%`}
          trend={{ value: 1.8, isPositive: true, isUpGood: false }}
          variant="glass"
        />
        
        <MetricCard
          title="Throughput"
          value={entityData.throughput.toLocaleString()}
          description="requests per hour"
          trend={{ value: 12.5, isPositive: true, isUpGood: true }}
          variant="glass"
        />
        
        <MetricCard
          title="Availability"
          value={`${(entityData.availability * 100).toFixed(2)}%`}
          description={`last deployed ${entityData.lastDeployed}`}
          variant="glass"
        />
      </div>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="traces">Request Traces</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <ResponseTimeChart
                title="Response Time (Last 24h)"
                data={responseTimeData}
              />
            </div>
            
            <ErrorRateChart
              title="Error Types"
              data={errorDistribution}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-lg p-6 lg:col-span-1">
              <h3 className="text-lg font-medium mb-4">Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Environment</h4>
                  <p className="text-sm mt-1">{entityData.environment}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Version</h4>
                  <p className="text-sm mt-1">{entityData.version}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Dependencies</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {entityData.dependencies.map((dep, i) => (
                      <Badge key={i} variant="outline" className="bg-accent">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {type === 'service' && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Endpoints</h4>
                    <div className="space-y-2 mt-2">
                      {entityData.endpoints.map((endpoint, i) => (
                        <div key={i} className="text-sm">
                          <Button variant="link" className="h-auto p-0 text-foreground hover:text-primary">
                            {endpoint}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <RequestFlow data={requestTraces[0]} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="pt-6">
          <div className="grid grid-cols-1 gap-6">
            <ResponseTimeChart
              title="Response Time (Last 7 Days)"
              data={responseTimeData}
              timeRanges={['24h', '7d', '30d']}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponseTimeChart
                title="P95 Response Times"
                data={responseTimeData.map(d => ({ ...d, value: d.value * 1.5 }))}
              />
              
              <ResponseTimeChart
                title="P99 Response Times"
                data={responseTimeData.map(d => ({ ...d, value: d.value * 2 }))}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="traces" className="pt-6">
          <div className="grid grid-cols-1 gap-6">
            {requestTraces.map((trace, index) => (
              <RequestFlow key={index} data={trace} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="predictions" className="pt-6">
          <div className="grid grid-cols-1 gap-6">
            <PredictiveAnalytics
              title="Response Time Prediction (Next 24h)"
              data={predictionData}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PredictiveAnalytics
                title="Error Rate Prediction"
                data={predictionData.map(d => ({ 
                  ...d, 
                  predicted: d.predicted / 20,
                  actual: d.actual ? d.actual / 20 : null,
                  lowerBound: d.lowerBound / 20,
                  upperBound: d.upperBound / 20,
                }))}
                metric="Error Rate"
              />
              
              <PredictiveAnalytics
                title="Throughput Prediction"
                data={predictionData.map(d => ({ 
                  ...d, 
                  predicted: d.predicted * 10,
                  actual: d.actual ? d.actual * 10 : null,
                  lowerBound: d.lowerBound * 8,
                  upperBound: d.upperBound * 12,
                }))}
                metric="Throughput"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default DetailView;
