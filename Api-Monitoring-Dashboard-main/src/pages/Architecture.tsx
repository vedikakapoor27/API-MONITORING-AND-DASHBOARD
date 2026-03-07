
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Database, Server, Monitor, Layers, Component, Grid2X2, ArrowRight, ArrowDown } from 'lucide-react';

const Architecture = () => {
  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
          <p className="text-muted-foreground mt-1">
            Overview of the API monitoring system architecture and components
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="components">Component Structure</TabsTrigger>
            <TabsTrigger value="dataflow">Data Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border border-dashed p-6 rounded-lg bg-background">
                  {/* Main system container */}
                  <div className="w-full h-[600px] flex flex-col items-center">
                    {/* Cloud Section */}
                    <div className="w-full flex justify-center mb-10 relative">
                      <div className="w-[80%] h-[120px] bg-sky-50 dark:bg-sky-950/30 rounded-[50%] p-4 flex justify-center items-center border border-dashed border-sky-300 dark:border-sky-800">
                        <div className="text-center flex flex-col items-center gap-2">
                          <Cloud className="h-8 w-8 text-sky-500" />
                          <h3 className="font-medium">API Services</h3>
                          <p className="text-sm text-muted-foreground">Production, Staging, Development</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="h-8 flex justify-center items-center">
                      <ArrowDown className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Monitoring Layer */}
                    <div className="w-[85%] h-[140px] bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4 mb-6 border border-dashed border-indigo-300 dark:border-indigo-800">
                      <h3 className="font-medium mb-2 text-center flex items-center justify-center gap-2">
                        <Monitor className="h-5 w-5 text-indigo-500" />
                        Monitoring & Data Collection Layer
                      </h3>
                      <div className="flex justify-around">
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Response Time</p>
                          <p className="text-xs text-muted-foreground">Performance Metrics</p>
                        </div>
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Error Tracking</p>
                          <p className="text-xs text-muted-foreground">Error Detection</p>
                        </div>
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Request Flow</p>
                          <p className="text-xs text-muted-foreground">Request Tracing</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="h-8 flex justify-center items-center">
                      <ArrowDown className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Processing Layer */}
                    <div className="w-[85%] h-[140px] bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 mb-6 border border-dashed border-emerald-300 dark:border-emerald-800">
                      <h3 className="font-medium mb-2 text-center flex items-center justify-center gap-2">
                        <Layers className="h-5 w-5 text-emerald-500" />
                        Processing & Analysis Layer
                      </h3>
                      <div className="flex justify-around">
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Analytics Engine</p>
                          <p className="text-xs text-muted-foreground">Data Processing</p>
                        </div>
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Predictions</p>
                          <p className="text-xs text-muted-foreground">ML Models</p>
                        </div>
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Alert System</p>
                          <p className="text-xs text-muted-foreground">Notifications</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="h-8 flex justify-center items-center">
                      <ArrowDown className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Dashboard Layer */}
                    <div className="w-[85%] h-[120px] bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-dashed border-orange-300 dark:border-orange-800">
                      <h3 className="font-medium mb-2 text-center flex items-center justify-center gap-2">
                        <Grid2X2 className="h-5 w-5 text-orange-500" />
                        Visualization Layer
                      </h3>
                      <div className="flex justify-around">
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Dashboard</p>
                          <p className="text-xs text-muted-foreground">Real-time Monitoring</p>
                        </div>
                        <div className="text-center p-2 bg-background rounded shadow-sm">
                          <p className="text-sm font-medium">Reports</p>
                          <p className="text-xs text-muted-foreground">Analytics & Insights</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Component Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-dashed p-6 rounded-lg">
                  <div className="flex justify-center">
                    <div className="space-y-4 w-full max-w-3xl">
                      {/* App Component */}
                      <div className="bg-primary-foreground p-4 rounded-lg border">
                        <h3 className="font-medium flex items-center gap-2">
                          <Component className="h-5 w-5 text-primary" />
                          App (Root)
                        </h3>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-sm">Router</p>
                          </div>
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-sm">Layout</p>
                          </div>
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-sm">Navigation</p>
                          </div>
                        </div>
                      </div>

                      {/* Pages */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-primary-foreground p-4 rounded-lg border">
                          <h3 className="font-medium mb-2 flex items-center gap-2">
                            <Grid2X2 className="h-5 w-5 text-primary" />
                            Main Pages
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Dashboard</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Response Time</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Error Tracking</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Request Flow</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Predictions</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Alerts</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-primary-foreground p-4 rounded-lg border">
                          <h3 className="font-medium mb-2 flex items-center gap-2">
                            <Component className="h-5 w-5 text-primary" />
                            UI Components
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Charts</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">MetricCards</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">RequestFlow</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Predictions</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">API Metrics</p>
                            </div>
                            <div className="p-2 bg-background rounded text-center">
                              <p className="text-sm">Alert System</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Data Layer */}
                      <div className="bg-primary-foreground p-4 rounded-lg border">
                        <h3 className="font-medium flex items-center gap-2">
                          <Database className="h-5 w-5 text-primary" />
                          Data Layer
                        </h3>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-sm">Mock Data</p>
                          </div>
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-sm">State Management</p>
                          </div>
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-sm">React Query</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dataflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-dashed p-6 rounded-lg">
                  {/* Data Flow Diagram */}
                  <div className="flex flex-col items-center space-y-8">
                    {/* API Services */}
                    <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-dashed border-sky-300 dark:border-sky-800 flex items-center w-64 justify-center">
                      <Cloud className="h-5 w-5 text-sky-500 mr-2" />
                      <span className="font-medium">API Services</span>
                    </div>
                    
                    <ArrowDown className="h-8 w-8 text-muted-foreground" />
                    
                    {/* Monitoring Components */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 flex items-center w-80 justify-center">
                      <Monitor className="h-5 w-5 text-indigo-500 mr-2" />
                      <span className="font-medium">Data Collection</span>
                    </div>
                    
                    <ArrowDown className="h-8 w-8 text-muted-foreground" />
                    
                    {/* Data Storage */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 flex items-center w-64 justify-center">
                      <Database className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="font-medium">Data Storage</span>
                    </div>
                    
                    {/* Bifurcation */}
                    <div className="w-full flex justify-center">
                      <div className="w-80 relative">
                        <div className="absolute w-full h-0.5 bg-muted-foreground top-4"></div>
                        <div className="flex justify-between">
                          <ArrowDown className="h-8 w-8 text-muted-foreground" />
                          <ArrowDown className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Two paths */}
                    <div className="flex gap-24">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-800 flex items-center w-44 justify-center">
                          <Layers className="h-5 w-5 text-emerald-500 mr-2" />
                          <span className="font-medium">Analytics</span>
                        </div>
                        <ArrowDown className="h-8 w-8 text-muted-foreground" />
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-dashed border-purple-300 dark:border-purple-800 flex items-center w-44 justify-center">
                          <Server className="h-5 w-5 text-purple-500 mr-2" />
                          <span className="font-medium">ML Models</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-dashed border-red-300 dark:border-red-800 flex items-center w-44 justify-center">
                          <Server className="h-5 w-5 text-red-500 mr-2" />
                          <span className="font-medium">Alert System</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Convergence */}
                    <div className="w-full flex justify-center">
                      <div className="w-80 relative">
                        <div className="absolute w-full h-0.5 bg-muted-foreground top-4"></div>
                        <div className="flex justify-between">
                          <ArrowDown className="h-8 w-8 text-muted-foreground" />
                          <ArrowDown className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Dashboard */}
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-dashed border-orange-300 dark:border-orange-800 flex items-center w-64 justify-center">
                      <Grid2X2 className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="font-medium">User Dashboard</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Architecture;
