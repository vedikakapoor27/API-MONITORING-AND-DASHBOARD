
import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import RequestFlowComponent from '@/components/RequestFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateRequestTrace, services, environments, endpoints } from '@/utils/mockData';
import { Network, Clock, RefreshCw, Server, ArrowRightLeft } from 'lucide-react';

const RequestFlowPage: React.FC = () => {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [requestTraces, setRequestTraces] = useState([
    generateRequestTrace(),
    generateRequestTrace(),
    generateRequestTrace(),
    generateRequestTrace(),
    generateRequestTrace()
  ]);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  
  // Stats calculations
  const avgTotalTime = Math.round(
    requestTraces.reduce((sum, item) => sum + item.totalTime, 0) / requestTraces.length
  );
  
  const successRate = Math.round(
    (requestTraces.filter(trace => trace.status === 'success').length / requestTraces.length) * 100
  );
  
  const totalSteps = requestTraces.reduce((sum, item) => sum + item.steps.length, 0);
  const avgSteps = Math.round(totalSteps / requestTraces.length);
  
  const refreshData = useCallback(() => {
    setRequestTraces([
      generateRequestTrace(),
      generateRequestTrace(),
      generateRequestTrace(),
      generateRequestTrace(),
      generateRequestTrace()
    ]);
    setRefreshTrigger(prev => prev + 1);
    
    toast({
      title: "Request flow data refreshed",
      description: "The latest request traces have been loaded",
    });
  }, [toast]);
  
  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Request Flow Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Visualize and analyze API request flows across services
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedService} onValueChange={setSelectedService}>
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
            
            <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
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
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Avg. Response Time"
            value={`${avgTotalTime}ms`}
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 3.2, isPositive: false, isUpGood: false }}
            description="Average total request time"
            delay={0}
            variant="glass"
          />
          
          <MetricCard
            title="Success Rate"
            value={`${successRate}%`}
            icon={<Server className="h-5 w-5" />}
            trend={{ value: 1.5, isPositive: true, isUpGood: true }}
            description="Percentage of successful requests"
            delay={100}
            variant="glass"
          />
          
          <MetricCard
            title="Avg. Service Hops"
            value={avgSteps.toString()}
            icon={<ArrowRightLeft className="h-5 w-5" />}
            description="Average number of services in request path"
            delay={200}
            variant="glass"
          />
          
          <MetricCard
            title="Analyzed Traces"
            value={requestTraces.length.toString()}
            icon={<Network className="h-5 w-5" />}
            description="Number of request traces analyzed"
            delay={300}
            variant="glass"
          />
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Latest Request Trace</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={requestTraces[0].status === 'success' ? 'outline' : 'destructive'}>
                {requestTraces[0].status === 'success' ? 'Success' : 'Error'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {requestTraces[0].totalTime}ms total
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <RequestFlowComponent 
              data={requestTraces[0]} 
              refreshTrigger={refreshTrigger}
              onRefresh={() => {
                const newTrace = generateRequestTrace();
                setRequestTraces([newTrace, ...requestTraces.slice(0, -1)]);
              }}
            />
          </CardContent>
        </Card>
        
        <Tabs defaultValue="recent" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="recent">Recent Traces</TabsTrigger>
            <TabsTrigger value="errors">Error Traces</TabsTrigger>
            <TabsTrigger value="slow">Slow Traces</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-6 space-y-6">
            {requestTraces.slice(1).map((trace, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium">
                      {trace.endpoint}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{trace.service}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{trace.environment}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={trace.status === 'success' ? 'outline' : 'destructive'}>
                      {trace.status === 'success' ? 'Success' : 'Error'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {trace.totalTime}ms total
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <RequestFlowComponent 
                    data={trace} 
                    refreshTrigger={refreshTrigger}
                    onRefresh={() => {}}
                    compact
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="errors" className="mt-6 space-y-6">
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Error traces will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="slow" className="mt-6 space-y-6">
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Slow traces will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RequestFlowPage;
