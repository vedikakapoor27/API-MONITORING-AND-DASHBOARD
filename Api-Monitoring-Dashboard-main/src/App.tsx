import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import DetailView from './pages/DetailView';
import NotFound from './pages/NotFound';
import ResponseTimePage from './pages/ResponseTime';
import ErrorTrackingPage from './pages/ErrorTracking';
import RequestFlowPage from './pages/RequestFlow';
import PredictionsPage from './pages/Predictions';
import ApiHealthPage from './pages/ApiHealth';
import AlertSystem from './components/AlertSystem';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/response-time" element={<ResponseTimePage />} />
          <Route path="/errors" element={<ErrorTrackingPage />} />
          <Route path="/request-flow" element={<RequestFlowPage />} />
          <Route path="/predictions" element={<PredictionsPage />} />
          <Route path="/api-health" element={<ApiHealthPage />} /> Ensure this route is correct
          <Route path="/alerts" element={<AlertSystem />} /> {/* Move AlertSystem to a specific route */}
          <Route path="/:type/:id" element={<DetailView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;