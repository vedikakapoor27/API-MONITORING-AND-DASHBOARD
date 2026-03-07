
import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import AlertSystem from '@/components/AlertSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';
import { generateRecentAlerts, services, environments } from '@/utils/mockData';
import { Bell, BellOff, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const AlertsPage: React.FC = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState(generateRecentAlerts(10));
  const [selectedService, setSelectedService] = useState('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  
  // Stats calculations
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
  const activeAlerts = alerts.filter(alert => alert.status === 'active').length;
  const acknowledgedAlerts = alerts.filter(alert => alert.status === 'acknowledged').length;
  
  const refreshData = useCallback(() => {
    setAlerts(generateRecentAlerts(10));
    
    toast({
      title: "Alerts refreshed",
      description: "The latest alerts have been loaded",
    });
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
  
  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight"></h1>
            <p className="text-muted-foreground mt-1">
              {/* Monitor and manage alerts across services */}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="all">All Services</SelectItem> */}
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                {environments.map(env => (
                  <SelectItem key={env} value={env}>{env}</SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            
            {/* <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button> */}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* <MetricCard
            title=""
            value={criticalAlerts.toString()}
            icon={<AlertCircle className="h-5 w-5" />}
            trend={{ value: 3.2, isPositive: false, isUpGood: false }}
            description="High priority alerts requiring attention"
            delay={0}
            variant="glass"
          /> */}
          
          {/* <MetricCard
            title="Active Alerts"
            value={activeAlerts.toString()}
            icon={<Bell className="h-5 w-5" />}
            trend={{ value: 2.5, isPositive: false, isUpGood: false }}
            description="Alerts waiting for response"
            delay={100}
            variant="glass"
          />
          
          <MetricCard
            title="Acknowledged"
            value={acknowledgedAlerts.toString()}
            icon={<BellOff className="h-5 w-5" />}
            description="Alerts being worked on"
            delay={200}
            variant="glass"
          />
          
          <MetricCard
            title="Alert Rules"
            value="15"
            icon={<Shield className="h-5 w-5" />}
            description="Active monitoring rules"
            delay={300}
            variant="glass"
          /> */}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AlertSystem
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
            />
          </div>
          
          <div>
            <Tabs defaultValue="rules" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                {/* <TabsTrigger value="rules">Alert Rules</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger> */}
              </TabsList>
              
              {/* <TabsContent value="rules" className="border rounded-md mt-6 h-full">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium"></h3>
                    <Button size="sm">
                      <span className="mr-1">+</span> 
                    </Button>
                  </div>
                  
                  <Input placeholder="Search rules..." />
                  
                  <div className="space-y-2 mt-4">
                    {['Response Time > 1000ms', 'Error Rate > 5%', 'Service Unavailable', 'CPU Usage > 80%', 'Memory Usage > 90%'].map((rule, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                        <span>{rule}</span>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent> */}
              
              {/* <TabsContent value="channels" className="border rounded-md mt-6 h-full">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Notification Channels</h3>
                    <Button size="sm">
                      <span className="mr-1">+</span> Add Channel
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4 mt-4">
                    {['Email', 'Slack', 'SMS', 'PagerDuty'].map((channel, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Bell className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{channel}</h4>
                            <p className="text-xs text-muted-foreground">
                              {i === 0 ? 'team@example.com' : 
                               i === 1 ? '#alerts' : 
                               i === 2 ? '+1234567890' : 'Incident Response'}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Configure</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent> */}
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AlertsPage;
