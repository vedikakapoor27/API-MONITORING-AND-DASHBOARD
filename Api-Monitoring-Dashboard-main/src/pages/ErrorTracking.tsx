
import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ErrorRateChart from '@/components/ErrorRateChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';
import { generateErrorDistribution, services, environments } from '@/utils/mockData';
import { AlertTriangle, AlertOctagon, PercentSquare, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ErrorTrackingPage: React.FC = () => {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [errorDistribution, setErrorDistribution] = useState(generateErrorDistribution());
  const [selectedService, setSelectedService] = useState('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  
  // Stats calculations
  const totalErrors = errorDistribution.reduce((sum, item) => sum + item.count, 0);
  const highestErrorType = [...errorDistribution].sort((a, b) => b.count - a.count)[0];
  const errorCategories = new Set(errorDistribution.map(item => item.type.split(' ')[0])).size;
  
  const refreshData = useCallback(() => {
    setErrorDistribution(generateErrorDistribution());
    setRefreshTrigger(prev => prev + 1);
    
    toast({
      title: "Error data refreshed",
      description: "The latest error data has been loaded",
    });
  }, [toast]);
  
  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Error Tracking</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and analyze API errors across services
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
            title="Total Errors"
            value={totalErrors.toString()}
            icon={<AlertOctagon className="h-5 w-5" />}
            trend={{ value: 12.5, isPositive: false, isUpGood: false }}
            description="Total errors across all services"
            delay={0}
            variant="glass"
          />
          
          <MetricCard
            title="Top Error Type"
            value={highestErrorType?.type || "None"}
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={{ value: 8.3, isPositive: false, isUpGood: false }}
            description={`${highestErrorType?.count || 0} occurrences`}
            delay={100}
            variant="glass"
          />
          
          <MetricCard
            title="Error Categories"
            value={errorCategories.toString()}
            icon={<PercentSquare className="h-5 w-5" />}
            description="Distinct error categories detected"
            delay={200}
            variant="glass"
          />
          
          <MetricCard
            title="Error Rate"
            value="2.3%"
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={{ value: 0.5, isPositive: true, isUpGood: false }}
            description="Average error rate across services"
            delay={300}
            variant="glass"
          />
        </div>
        
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="byservice">By Service</TabsTrigger>
            <TabsTrigger value="byenvironment">By Environment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ErrorRateChart 
                title="Error Distribution" 
                data={errorDistribution}
                refreshTrigger={refreshTrigger}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Top Errors Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Timeline visualization of top errors</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="byservice" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ErrorRateChart 
                title="Errors by Service" 
                data={errorDistribution.map(item => ({
                  ...item,
                  count: Math.floor(item.count * 0.8)
                }))}
                refreshTrigger={refreshTrigger}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Service Error Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Comparison of error rates across services</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="byenvironment" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ErrorRateChart 
                title="Errors by Environment" 
                data={errorDistribution.map(item => ({
                  ...item,
                  count: Math.floor(item.count * 1.2)
                }))}
                refreshTrigger={refreshTrigger}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Environment Error Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Comparison of error rates across environments</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ErrorTrackingPage;
