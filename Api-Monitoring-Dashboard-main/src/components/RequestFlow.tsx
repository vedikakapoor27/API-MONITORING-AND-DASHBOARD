// src/components/RequestFlow.tsx
import React, { useEffect, useState } from "react";
import ReactFlow, { MiniMap, Controls, Background } from "react-flow-renderer";
import axios from "axios";

const initialElements = [{ id: "1", data: { label: "Start" }, position: { x: 0, y: 0 } }];

interface FlowData {
  trace_id: string;
  endpoints: string[];
  environments: string[];
}

const RequestFlow: React.FC = () => {
  const [elements, setElements] = useState(initialElements);

  useEffect(() => {
    const fetchRequestFlow = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/request-flow");
        const flows: FlowData[] = response.data;
        const newElements = flows.flatMap((flow, index) =>
          flow.endpoints.map((endpoint, i) => ({
            id: `${index}-${i}`,
            data: { label: `${endpoint} (${flow.environments[i]})` },
            position: { x: i * 150, y: index * 100 },
            sourcePosition: i > 0 ? "left" : undefined,
            targetPosition: i < flow.endpoints.length - 1 ? "right" : undefined,
            source: i > 0 ? `${index}-${i - 1}` : undefined,
            target: i < flow.endpoints.length - 1 ? `${index}-${i + 1}` : undefined,
          }))
        );
        setElements(newElements);
      } catch (error) {
        console.error("Error fetching request flow:", error);
      }
    };
    fetchRequestFlow();
    const interval = setInterval(fetchRequestFlow, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400, width: "100%" }}>
      <ReactFlow elements={elements}>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default RequestFlow;