// src/pages/Index.tsx
import React from "react";
import Layout from "../components/Layout";
// import Dashboard from "../components/Dashboard";
import APIMetrics from "../components/APIMetrics";
import AlertSystem from "../components/AlertSystem";
import ErrorRateChart from "../components/ErrorRateChart";
import ResponseTimeChart from "../components/ResponseTimeChart";
import RequestFlow from "../components/RequestFlow";
import Predictions from "./Predictions";
// import ApiHealth from './ApiHealth';



// import DarkModeToggle from "./DarkModeToggle";

const Index: React.FC = () => {
  return (
    <Layout>
      <APIMetrics />
      <AlertSystem />
      <ErrorRateChart />
      <ResponseTimeChart />
      <RequestFlow />
      <Predictions />
      {/* <ApiHealth /> */}
      {/* Uncomment the following lines to include the DarkModeToggle and Dashboard components */}
      {/* <DarkModeToggle /> */}
      {/* <Dashboard /> */}
    </Layout>
  );
};

export default Index;