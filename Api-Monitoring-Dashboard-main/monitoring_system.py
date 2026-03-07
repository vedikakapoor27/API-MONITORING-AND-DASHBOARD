from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import JSONResponse
import asyncio
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import numpy as np
from pymongo import MongoClient
from prophet import Prophet
import os
from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from bson import ObjectId
from starlette.websockets import WebSocketDisconnect
import logging
from datetime import datetime, timedelta
from collections import defaultdict
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# FastAPI app setup
app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def custom_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:8080",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )

# MongoDB and Elasticsearch setup
mongo_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = mongo_client["api_monitoring"]
logs_collection = db["api_logs"]
alerts_collection = db["alerts"]
predicted_alerts_collection = db["predicted_alerts"]
health_records_collection = db["api_health_records"]  # New collection for health records

es = Elasticsearch(["http://localhost:9200"])

# Initialize IsolationForest for anomaly detection
model = IsolationForest(contamination=0.1, random_state=42)
environment_metrics = {}

# Thresholds for alerting and predictions
alert_thresholds = {"response_time": 200, "error_rate": 0.01}
env_thresholds = {
    "on_prem": {"response_time": 250, "error_rate": 0.02},
    "aws_cloud": {"response_time": 200, "error_rate": 0.01},
    "multi_cloud": {"response_time": 300, "error_rate": 0.015}
}

class APIMonitoringSystem:
    def __init__(self):
        self.last_logs = {}
        self.executor = ThreadPoolExecutor(max_workers=2)

    async def collect_logs(self, api_endpoint: str = None, environment: str = None) -> Dict:
        api_endpoint = api_endpoint or "api1"
        environment = environment or "aws_cloud"
        key = f"{api_endpoint}_{environment}"
        logger.info(f"Collecting logs for {key}")
        try:
            if key not in self.last_logs or (pd.Timestamp.now() - self.last_logs[key]["timestamp"]).total_seconds() > 300:
                logs = await self._fetch_logs_from_source(api_endpoint, environment)
                processed_data = await asyncio.get_running_loop().run_in_executor(
                    self.executor, lambda: self._process_logs(logs)
                )
                await self._store_logs(processed_data)
                self.last_logs[key] = {"data": processed_data.to_dict("records"), "timestamp": pd.Timestamp.now()}
                logger.info(f"Collected and processed {len(processed_data)} logs for {key}, sample: {processed_data.head().to_dict() if not processed_data.empty else 'No data'}")
            else:
                processed_data = pd.DataFrame(self.last_logs[key]["data"])
                logger.info(f"Using cached {len(processed_data)} logs for {key}")
            if processed_data.empty:
                logger.warning(f"No valid data collected for {key}")
            return processed_data.to_dict("records")
        except Exception as e:
            logger.error(f"Error collecting logs for {key}: {str(e)}")
            return {}

    async def _fetch_logs_from_source(self, endpoint: str, environment: str) -> List[Dict]:
        try:
            logs = [
                {
                    "timestamp": pd.Timestamp.now() - pd.Timedelta(minutes=np.random.randint(0, 60)),  # Within last hour
                    "endpoint": endpoint,
                    "response_time": np.random.normal(400, 50),
                    "status_code": 200 if np.random.random() > 0.1 else 500,
                    "environment": environment
                } for _ in range(500)
            ]
            logger.info(f"Fetched {len(logs)} logs for {endpoint}_{environment}, sample: {logs[:2]}")
            return logs
        except Exception as e:
            logger.error(f"Error fetching logs from source for {endpoint}_{environment}: {str(e)}")
            return []

    def _process_logs(self, logs: List[Dict]) -> pd.DataFrame:
        try:
            df = pd.DataFrame(logs)
            if df.empty:
                logger.warning("Empty logs received for processing")
                return df
            df["error"] = df["status_code"].apply(lambda x: 1 if x >= 400 else 0)
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            invalid_rows = df[df[["timestamp", "response_time", "status_code"]].isna().any(axis=1)]
            if not invalid_rows.empty:
                logger.warning(f"Found {len(invalid_rows)} invalid rows: {invalid_rows.head().to_dict()}")
            df = df.dropna(subset=["timestamp", "response_time", "status_code"])
            env_metrics = df.groupby("environment").agg({
                "response_time": ["mean", "std"],
                "error": "mean"
            })
            environment_metrics.update(env_metrics.to_dict())
            logger.info(f"Processed logs - environment_metrics: {env_metrics}")
            return df
        except Exception as e:
            logger.error(f"Error processing logs: {str(e)}")
            return pd.DataFrame()

    async def _store_logs(self, df: pd.DataFrame):
        try:
            if df.empty:
                logger.warning("No logs to store")
                return
            records = df.to_dict("records")
            logger.info(f"Attempting to store {len(records)} logs in MongoDB")

            def insert_to_mongo():
                try:
                    result = logs_collection.insert_many(records)
                    logger.info(f"Inserted {len(result.inserted_ids)} logs into MongoDB")
                    return result.inserted_ids
                except Exception as e:
                    logger.error(f"Error inserting logs into MongoDB: {str(e)}")
                    raise

            inserted_ids = await asyncio.get_running_loop().run_in_executor(self.executor, insert_to_mongo)

            es_records = [
                {
                    k: str(v) if k == "_id" and isinstance(v, ObjectId) else v
                    for k, v in {
                        **record,
                        "timestamp": record["timestamp"].isoformat()
                    }.items()
                    if k != "_id" or not isinstance(v, ObjectId)
                }
                for record in records
            ]
            actions = [
                {
                    "_index": "api-logs",
                    "_id": str(inserted_ids[idx]),
                    "_source": es_record
                }
                for idx, es_record in enumerate(es_records)
            ]

            def bulk_to_es():
                try:
                    bulk(es, actions)
                    logger.info(f"Indexed {len(actions)} logs to Elasticsearch")
                except Exception as e:
                    logger.error(f"Error bulk indexing to Elasticsearch: {str(e)}")

            await asyncio.get_running_loop().run_in_executor(self.executor, bulk_to_es)
        except Exception as e:
            logger.error(f"Error storing logs: {str(e)}")

    async def detect_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        try:
            if df.empty or len(df) == 0:
                logger.warning("DataFrame is empty - no alerts generated")
                return []

            alerts = []
            for env in df["environment"].unique():
                env_df = df[df["environment"] == env]
                for _, row in env_df.iterrows():
                    alert = await asyncio.get_running_loop().run_in_executor(
                        self.executor, lambda: self._create_alert(row, env)
                    )
                    if alert:
                        logger.info(f"Created alert for {env}: {alert}")
                        alerts.append(alert)
            logger.info(f"Generated alerts: {len(alerts)} entries")

            if alerts:
                def store_alerts():
                    try:
                        result = alerts_collection.insert_many(alerts)
                        for idx, alert in enumerate(alerts):
                            alert["id"] = str(result.inserted_ids[idx])
                        return alerts
                    except Exception as e:
                        logger.error(f"Error storing alerts in MongoDB: {str(e)}")
                        raise
                alerts = await asyncio.get_running_loop().run_in_executor(self.executor, store_alerts)

            return alerts
        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            return []

    def _create_alert(self, row: pd.Series, env: str) -> Optional[Dict]:
        try:
            thresholds = env_thresholds.get(env, alert_thresholds)
            alert_types = []
            logger.info(f"Checking alert for {env} - response_time: {row['response_time']}, error: {row['error']}, thresholds: {thresholds}")
            if pd.isna(row["response_time"]) or row["response_time"] > thresholds["response_time"]:
                alert_types.append("high_response_time")
            env_error_rate = environment_metrics.get(env, {}).get(("error", "mean"), 0)
            if not pd.isna(env_error_rate) and env_error_rate > thresholds["error_rate"]:
                alert_types.append("high_error_rate")

            if alert_types:
                severity = "critical" if row["response_time"] > thresholds["response_time"] * 1.5 else "warning"
                alert = {
                    "timestamp": row["timestamp"].isoformat(),
                    "endpoint": row["endpoint"],
                    "environment": env,
                    "alert_types": alert_types,
                    "metrics": {
                        "response_time": row["response_time"] if not pd.isna(row["response_time"]) else 0,
                        "error": row["error"] if not pd.isna(row["error"]) else 0
                    },
                    "severity": severity,
                    "status": "active"
                }
                return alert
            return None
        except Exception as e:
            logger.error(f"Error creating alert for {env}: {str(e)}")
            return None

    async def predict_failures(self, historical_data: pd.DataFrame) -> Dict:
        try:
            loop = asyncio.get_running_loop()
            predictions = {}

            if historical_data.empty or len(historical_data) < 10:
                logger.warning(f"Insufficient historical data for predictions: {len(historical_data)} rows")
                logger.info(f"Historical data sample: {historical_data.head().to_dict() if not historical_data.empty else 'No data'}")
                return predictions

            logger.info(f"Processing predictions with {len(historical_data)} total rows")
            for env in historical_data["environment"].unique():
                for endpoint in historical_data["endpoint"].unique():
                    df = historical_data[(historical_data["environment"] == env) & (historical_data["endpoint"] == endpoint)]
                    if len(df) < 10:
                        logger.info(f"Skipping {endpoint}_{env}: insufficient data ({len(df)} rows)")
                        continue

                    prophet_df = df[["timestamp", "response_time"]].copy()
                    prophet_df["timestamp"] = pd.to_datetime(prophet_df["timestamp"], errors="coerce")
                    prophet_df["response_time"] = pd.to_numeric(prophet_df["response_time"], errors="coerce")
                    prophet_df = prophet_df.dropna(subset=["timestamp", "response_time"])
                    if len(prophet_df) < 10:
                        logger.warning(f"Skipping {endpoint}_{env}: invalid or insufficient data after cleaning ({len(prophet_df)} rows)")
                        logger.info(f"Prophet input data sample for {endpoint}_{env}: {prophet_df.head().to_dict() if not prophet_df.empty else 'No data'}")
                        continue

                    prophet_df = prophet_df.rename(columns={"timestamp": "ds", "response_time": "y"})
                    def run_prophet():
                        try:
                            model = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=True, seasonality_mode="additive")
                            model.fit(prophet_df)
                            future = model.make_future_dataframe(periods=60, freq="min")
                            forecast = model.predict(future)
                            forecasted_value = max(min(forecast["yhat"].iloc[-1], 1000), 0)
                            uncertainty = forecast["yhat_upper"].iloc[-1] - forecast["yhat_lower"].iloc[-1]
                            confidence = max(0.5, min(0.95, 1 - (uncertainty / (forecasted_value if forecasted_value > 0 else 1))))
                            threshold = env_thresholds.get(env, alert_thresholds).get("response_time", 200) * 1.2
                            deviation = (forecasted_value - threshold) / threshold if forecasted_value > threshold else 0
                            risk = "low" if deviation < 0.1 else "medium" if deviation < 0.5 else "high"
                            impact = "temporary_spike" if deviation < 0.3 else "service_degradation" if deviation < 1.0 else "outage_risk"
                            return {
                                "forecasted_value": forecasted_value,
                                "confidence": confidence,
                                "threshold": threshold,
                                "deviation": deviation,
                                "risk": risk,
                                "impact": impact
                            }
                        except Exception as e:
                            logger.error(f"Prophet error for {endpoint}_{env}: {str(e)}")
                            return None

                    result = await loop.run_in_executor(self.executor, run_prophet)
                    if result:
                        forecasted_value = result["forecasted_value"]
                        confidence = result["confidence"]
                        threshold = result["threshold"]
                        deviation = result["deviation"]
                        risk = result["risk"]
                        impact = result["impact"]

                        logger.info(f"Debug: {endpoint}_{env} - Forecasted = {forecasted_value} ms, Threshold = {threshold} ms, Deviation = {deviation:.2f}, Confidence = {confidence:.2f}")
                        predictions[f"{endpoint}_{env}"] = {
                            "risk": risk,
                            "expected_impact": impact,
                            "confidence": round(confidence * 100, 2) / 100,
                            "forecasted_response_time": forecasted_value,
                            "threshold": threshold
                        }
        except Exception as e:
            logger.error(f"Async error in predict_failures: {str(e)}")
            return predictions
        logger.info(f"Returning predictions: {len(predictions)} entries")
        return predictions

    async def correlate_cross_environment(self, alerts: List[Dict], traces: List[Dict]) -> Dict:
        try:
            correlations = {}
            trace_groups = {}
            for trace in traces:
                trace_id = trace.get("trace_id")
                if trace_id not in trace_groups:
                    trace_groups[trace_id] = []
                trace_groups[trace_id].append(trace)
            for trace_id, trace_group in trace_groups.items():
                endpoints = set(t["endpoint"] for t in trace_group)
                envs = set(t["environment"] for t in trace_group)
                if len(envs) > 1:
                    related_alerts = [a for a in alerts if a["endpoint"] in endpoints]
                    if related_alerts:
                        correlations[trace_id] = {
                            "endpoints": list(endpoints),
                            "environments": list(envs),
                            "alerts": related_alerts
                        }
            logger.info(f"Cross-environment correlations: {correlations}")
            return correlations
        except Exception as e:
            logger.error(f"Error correlating cross-environment: {str(e)}")
            return {}

    async def run_monitoring(self):
        while True:
            try:
                logger.info("Starting monitoring cycle...")
                environments = ["on_prem", "aws_cloud", "multi_cloud"]
                apis = ["api1", "api2", "api3"]
                for env in environments:
                    for api in apis:
                        logs = await self.collect_logs(api, env)
                        if not logs:
                            logger.warning(f"No logs collected for {api}_{env}")
                            continue
                        df = pd.DataFrame(logs)
                        await self._store_logs(df)
                        alerts = await self.detect_anomalies(df)
                        predictions = await self.predict_failures(df)
                        correlations = await self.correlate_cross_environment(alerts, df.to_dict("records"))
                        # Calculate and store health metrics
                        health_data = await self.calculate_health_metrics(df)
                        if health_data:
                            await self.store_health_metrics(health_data)
                        logger.info(f"Monitoring cycle for {api}_{env}: Alerts={len(alerts)}, Predictions={len(predictions)}, Correlations={len(correlations)}, Health Records={len(health_data)}")
            except Exception as e:
                logger.error(f"Monitoring error: {str(e)}")
            await asyncio.sleep(60)

    async def calculate_health_metrics(self, df: pd.DataFrame) -> List[Dict]:
        try:
            if df.empty:
                logger.warning("Empty DataFrame for health calculation")
                return []

            invalid_rows = df[df[["timestamp", "response_time", "status_code"]].isna().any(axis=1)]
            if not invalid_rows.empty:
                logger.warning(f"Found {len(invalid_rows)} invalid rows: {invalid_rows.head().to_dict()}")

            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            df = df.dropna(subset=["timestamp", "response_time", "status_code"])
            logger.info(f"Cleaned DataFrame shape: {df.shape}, sample: {df.head().to_dict() if not df.empty else 'Empty'}")

            if df.empty:
                logger.warning("No valid data after cleaning")
                return []

            health_metrics = defaultdict(lambda: {
                "total_requests": 0,
                "successful_requests": 0,
                "response_time_sum": 0.0,
                "error_count": 0
            })

            for _, row in df.iterrows():
                key = f"{row['endpoint']}_{row['environment']}"
                try:
                    health_metrics[key]["total_requests"] += 1
                    health_metrics[key]["response_time_sum"] += float(row["response_time"])
                    if int(row["status_code"]) < 400:
                        health_metrics[key]["successful_requests"] += 1
                    if int(row["status_code"]) >= 400:
                        health_metrics[key]["error_count"] += 1
                except (ValueError, TypeError) as e:
                    logger.error(f"Error processing row {row}: {str(e)}")
                    continue

            health_data = []
            current_time = datetime.utcnow().isoformat() + "Z"
            for key, metrics in health_metrics.items():
                endpoint, environment = key.split("_", 1)
                total_requests = metrics["total_requests"]
                if total_requests == 0:
                    continue

                uptime = (metrics["successful_requests"] / total_requests) * 100
                avg_response_time = metrics["response_time_sum"] / total_requests
                error_rate = (metrics["error_count"] / total_requests) * 100

                thresholds = env_thresholds.get(environment, alert_thresholds)
                if (uptime < 95 or error_rate > thresholds["error_rate"] * 100 * 1.5 or
                    avg_response_time > thresholds["response_time"] * 1.5):
                    status = "critical"
                elif (uptime < 99 or error_rate > thresholds["error_rate"] * 100 or
                      avg_response_time > thresholds["response_time"]):
                    status = "degraded"
                else:
                    status = "healthy"

                health_data.append({
                    "timestamp": current_time,
                    "endpoint": endpoint,
                    "environment": environment,
                    "uptime": round(uptime, 2),
                    "avg_response_time": round(avg_response_time, 2),
                    "error_rate": round(error_rate, 2),
                    "status": status,
                    "total_requests": total_requests
                })

            return health_data
        except Exception as e:
            logger.error(f"Error calculating health metrics: {str(e)}")
            return []

    async def store_health_metrics(self, health_data: List[Dict]):
        try:
            if not health_data:
                logger.warning("No health data to store")
                return

            def insert_health_records():
                try:
                    result = health_records_collection.insert_many(health_data)
                    logger.info(f"Stored {len(result.inserted_ids)} health records in MongoDB")
                    return result.inserted_ids
                except Exception as e:
                    logger.error(f"Error storing health records in MongoDB: {str(e)}")
                    raise

            await asyncio.get_running_loop().run_in_executor(self.executor, insert_health_records)
        except Exception as e:
            logger.error(f"Error in store_health_metrics: {str(e)}")

monitor = APIMonitoringSystem()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor.run_monitoring())
    logger.info("Started monitoring loop")

    # Seed test logs if collection is empty
    async def seed_logs():
        try:
            count = await asyncio.get_running_loop().run_in_executor(
                monitor.executor, lambda: logs_collection.count_documents({})
            )
            if count == 0:
                logger.info("Seeding initial logs...")
                logs = [
                    {
                        "timestamp": (pd.Timestamp.now() - pd.Timedelta(minutes=i)).isoformat(),
                        "endpoint": "api1",
                        "response_time": 400 + i * 10,
                        "status_code": 200 if i % 2 == 0 else 500,
                        "environment": "aws_cloud",
                        "error": 0 if i % 2 == 0 else 1
                    } for i in range(10)
                ]
                await monitor._store_logs(pd.DataFrame(logs))
                logger.info("Seeded 10 initial logs")
        except Exception as e:
            logger.error(f"Error seeding logs: {str(e)}")

    asyncio.create_task(seed_logs())

@app.get("/api/logs")
async def get_logs(endpoint: str = None, environment: str = None):
    try:
        query = {}
        if endpoint:
            query["endpoint"] = endpoint
        if environment:
            query["environment"] = environment
        def fetch_logs():
            try:
                logs = list(logs_collection.find(query).sort("timestamp", -1).limit(100))
                return logs
            except Exception as e:
                logger.error(f"Error fetching logs from MongoDB: {str(e)}")
                raise
        logs = await asyncio.get_running_loop().run_in_executor(monitor.executor, fetch_logs)
        return [
            {**{k: str(v) if k == "_id" else v for k, v in log.items()}, **{"id": str(log["_id"])}} 
            for log in logs
        ]
    except Exception as e:
        logger.error(f"Error in /api/logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/predicted_alerts")
async def get_predicted_alerts():
    try:
        logger.info("Fetching logs for predicted alerts...")
        logs = await monitor.collect_logs()
        if not logs:
            logger.warning("No logs available for predicting alerts")
            return []

        logger.info(f"Converting {len(logs)} logs to DataFrame...")
        df = pd.DataFrame(logs)
        if df.empty:
            logger.warning("Empty DataFrame after conversion - cannot predict alerts")
            return []
        logger.info(f"DataFrame created with {len(df)} rows: {df.head(2).to_dict()}")

        logger.info("Running predict_failures...")
        predictions = await monitor.predict_failures(df)
        if not predictions:
            logger.warning("No predictions generated for alerts")
            return []
        logger.info(f"Generated {len(predictions)} predictions: {predictions}")

        predicted_alerts = []
        current_time = datetime.utcnow()
        logger.info("Converting predictions to alerts...")
        for key, pred in predictions.items():
            try:
                endpoint, environment = key.split("_", 1)
                if pred["forecasted_response_time"] > pred["threshold"]:
                    severity = "critical" if pred["risk"] == "high" else "warning" if pred["risk"] == "medium" else "info"
                    future_time = current_time + timedelta(minutes=5 + len(predicted_alerts) * 5)
                    alert = {
                        "timestamp": future_time.isoformat() + "Z",
                        "endpoint": endpoint,
                        "environment": environment,
                        "alert_types": ["high_response_time"],
                        "metrics": {
                            "response_time": float(pred["forecasted_response_time"]),
                            "error": 0
                        },
                        "severity": severity,
                        "status": "active"
                    }
                    predicted_alerts.append(alert)
                    logger.info(f"Predicted alert for {key}: {alert}")
            except Exception as e:
                logger.error(f"Error converting prediction to alert for {key}: {str(e)}")
                continue

        if not predicted_alerts:
            logger.warning("No predicted alerts generated after conversion")
            return []

        logger.info(f"Storing {len(predicted_alerts)} predicted alerts in MongoDB...")
        def store_predicted_alerts():
            try:
                alerts_to_store = [{k: v for k, v in alert.items()} for alert in predicted_alerts]
                result = predicted_alerts_collection.insert_many(alerts_to_store)
                inserted_ids = result.inserted_ids
                logger.info(f"Inserted IDs from MongoDB: {inserted_ids}")
                
                updated_alerts = []
                for idx, alert in enumerate(predicted_alerts):
                    new_alert = {**alert, "id": str(inserted_ids[idx])}
                    updated_alerts.append(new_alert)
                logger.info(f"Updated alerts with IDs: {updated_alerts[:1]}")
                return updated_alerts
            except Exception as e:
                logger.error(f"Error storing predicted alerts in MongoDB: {str(e)}")
                raise

        predicted_alerts = await asyncio.get_running_loop().run_in_executor(monitor.executor, store_predicted_alerts)

        logger.info(f"Returning {len(predicted_alerts)} predicted alerts")
        return predicted_alerts

    except Exception as e:
        logger.error(f"Error in /api/predicted_alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/predicted_alerts/all")
async def get_all_predicted_alerts():
    try:
        def fetch_predicted_alerts():
            try:
                alerts = list(predicted_alerts_collection.find().sort("timestamp", -1))
                return alerts
            except Exception as e:
                logger.error(f"Error fetching all predicted alerts from MongoDB: {str(e)}")
                raise
        alerts = await asyncio.get_running_loop().run_in_executor(monitor.executor, fetch_predicted_alerts)
        return [
            {**{k: str(v) if k == "_id" else v for k, v in alert.items()}, **{"id": str(alert["_id"])}}
            for alert in alerts
        ]
    except Exception as e:
        logger.error(f"Error in /api/predicted_alerts/all: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    try:
        def update_alert():
            try:
                result = alerts_collection.update_one(
                    {"_id": ObjectId(alert_id)},
                    {"$set": {"status": "acknowledged"}}
                )
                return result.modified_count
            except Exception as e:
                logger.error(f"Error updating alert {alert_id} in MongoDB: {str(e)}")
                raise
        modified_count = await asyncio.get_running_loop().run_in_executor(monitor.executor, update_alert)
        if modified_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"message": "Alert acknowledged successfully"}
    except Exception as e:
        logger.error(f"Error acknowledging alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    try:
        def update_alert():
            try:
                result = alerts_collection.update_one(
                    {"_id": ObjectId(alert_id)},
                    {"$set": {"status": "resolved"}}
                )
                return result.modified_count
            except Exception as e:
                logger.error(f"Error updating alert {alert_id} in MongoDB: {str(e)}")
                raise
        modified_count = await asyncio.get_running_loop().run_in_executor(monitor.executor, update_alert)
        if modified_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"message": "Alert resolved successfully"}
    except Exception as e:
        logger.error(f"Error resolving alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/api/predicted_alerts/{alert_id}/acknowledge")
async def acknowledge_predicted_alert(alert_id: str):
    try:
        def update_alert():
            try:
                result = predicted_alerts_collection.update_one(
                    {"_id": ObjectId(alert_id)},
                    {"$set": {"status": "acknowledged"}}
                )
                return result.modified_count
            except Exception as e:
                logger.error(f"Error updating predicted alert {alert_id} in MongoDB: {str(e)}")
                raise
        modified_count = await asyncio.get_running_loop().run_in_executor(monitor.executor, update_alert)
        if modified_count == 0:
            raise HTTPException(status_code=404, detail="Predicted alert not found")
        return {"message": "Predicted alert acknowledged successfully"}
    except Exception as e:
        logger.error(f"Error acknowledging predicted alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/api/predicted_alerts/{alert_id}/resolve")
async def resolve_predicted_alert(alert_id: str):
    try:
        def update_alert():
            try:
                result = predicted_alerts_collection.update_one(
                    {"_id": ObjectId(alert_id)},
                    {"$set": {"status": "resolved"}}
                )
                return result.modified_count
            except Exception as e:
                logger.error(f"Error updating predicted alert {alert_id} in MongoDB: {str(e)}")
                raise
        modified_count = await asyncio.get_running_loop().run_in_executor(monitor.executor, update_alert)
        if modified_count == 0:
            raise HTTPException(status_code=404, detail="Predicted alert not found")
        return {"message": "Predicted alert resolved successfully"}
    except Exception as e:
        logger.error(f"Error resolving predicted alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/logs/all")
async def get_all_logs(endpoint: str = None, environment: str = None):
    try:
        query = {}
        if endpoint:
            query["endpoint"] = endpoint
        if environment:
            query["environment"] = environment
        def fetch_all_logs():
            try:
                logs = list(logs_collection.find(query).sort("timestamp", -1))
                return logs
            except Exception as e:
                logger.error(f"Error fetching all logs from MongoDB: {str(e)}")
                raise
        logs = await asyncio.get_running_loop().run_in_executor(monitor.executor, fetch_all_logs)
        return [
            {**{k: str(v) if k == "_id" else v for k, v in log.items()}, **{"id": str(log["_id"])}} 
            for log in logs
        ]
    except Exception as e:
        logger.error(f"Error in /api/logs/all: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/logs/total")
async def get_total_logs():
    try:
        total = await asyncio.get_running_loop().run_in_executor(
            monitor.executor, lambda: logs_collection.count_documents({})
        )
        return {"totalLogs": total}
    except Exception as e:
        logger.error(f"Error in /api/logs/total: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/alerts")
async def get_alerts():
    try:
        def fetch_alerts():
            try:
                alerts = list(alerts_collection.find().sort("timestamp", -1).limit(10))
                return alerts
            except Exception as e:
                logger.error(f"Error fetching alerts from MongoDB: {str(e)}")
                raise
        alerts = await asyncio.get_running_loop().run_in_executor(monitor.executor, fetch_alerts)
        return [
            {**{k: str(v) if k == "_id" else v for k, v in alert.items()}, **{"id": str(alert["_id"])}}
            for alert in alerts
        ]
    except Exception as e:
        logger.error(f"Error in /api/alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/predict")
async def predict_response_time():
    try:
        logs = await monitor.collect_logs()
        if not logs:
            logger.warning("No logs available for prediction")
            return []

        df = pd.DataFrame(logs)
        if df.empty or len(df) < 2:
            logger.warning(f"Insufficient data for prediction: {len(df)} rows")
            return []

        prophet_df = df[['timestamp', 'response_time']].copy()
        prophet_df['timestamp'] = pd.to_datetime(prophet_df['timestamp'], errors='coerce')
        prophet_df['response_time'] = pd.to_numeric(prophet_df['response_time'], errors='coerce')
        prophet_df = prophet_df.dropna()
        if len(prophet_df) < 2:
            logger.warning(f"Insufficient valid data for prediction after cleaning: {len(prophet_df)} rows")
            return []

        prophet_df = prophet_df.rename(columns={'timestamp': 'ds', 'response_time': 'y'})
        logger.info(f"Prepared data for Prophet: {len(prophet_df)} rows")

        model = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=True)
        model.fit(prophet_df)
        future = model.make_future_dataframe(periods=24, freq='H')
        forecast = model.predict(future)
        predictions = forecast[['ds', 'yhat']].tail(24).to_dict('records')
        
        formatted_predictions = [
            {
                "timestamp": str(pred["ds"]),
                "predicted_response_time": max(0, pred["yhat"])
            }
            for pred in predictions
        ]
        logger.info(f"GET /api/predict - Returning predictions: {formatted_predictions}")
        return formatted_predictions
    except Exception as e:
        logger.error(f"Error in predict_response_time: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/predictions")
async def get_predictions():
    try:
        logger.info("Received request for /api/predictions")
        logs = await monitor.collect_logs()
        df = pd.DataFrame(logs)
        predictions = await monitor.predict_failures(df)
        logger.info(f"GET /api/predictions - Predictions: {predictions}")
        if not predictions:
            logger.warning("No predictions generated")
        return predictions
    except Exception as e:
        logger.error(f"Error in /api/predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api-health")
async def get_api_health():
    try:
        logger.info("Fetching API health data...")
        time_threshold = datetime.utcnow() - timedelta(hours=1)

        def fetch_logs():
            try:
                logs = list(logs_collection.find(
                    {"timestamp": {"$gte": time_threshold.isoformat()}},
                    sort=[("timestamp", -1)]
                ))
                if not logs:
                    logs = list(logs_collection.find(
                        {"timestamp": {"$gte": time_threshold}},
                        sort=[("timestamp", -1)]
                    ))
                logger.info(f"Fetched {len(logs)} logs for health calculation")
                return logs
            except Exception as e:
                logger.error(f"Error fetching logs for health: {str(e)}")
                raise

        logs = await asyncio.get_running_loop().run_in_executor(monitor.executor, fetch_logs)
        if not logs:
            logger.warning("No logs available for health calculation within the last hour")
            return []

        df = pd.DataFrame(logs)
        logger.info(f"Raw DataFrame shape: {df.shape}, sample: {df.head().to_dict() if not df.empty else 'Empty'}")
        if df.empty:
            logger.warning("Empty DataFrame for health calculation after fetch")
            return []

        health_data = await monitor.calculate_health_metrics(df)
        if health_data:
            await monitor.store_health_metrics(health_data)

        logger.info(f"Returning health data: {health_data}")
        return health_data

    except Exception as e:
        logger.error(f"Error in /api-health: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api-health/history")
async def get_api_health_history(limit: int = 100):
    try:
        logger.info(f"Fetching API health history with limit={limit}...")
        def fetch_health_records():
            try:
                records = list(health_records_collection.find().sort("timestamp", -1).limit(limit))
                return records
            except Exception as e:
                logger.error(f"Error fetching health records from MongoDB: {str(e)}")
                raise
        records = await asyncio.get_running_loop().run_in_executor(monitor.executor, fetch_health_records)
        logger.info(f"Fetched {len(records)} health records")
        return [
            {**{k: str(v) if k == "_id" else v for k, v in record.items()}, **{"id": str(record["_id"])}}
            for record in records
        ]
    except Exception as e:
        logger.error(f"Error in /api-health/history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/request-flow")
async def get_request_flow():
    try:
        logs = await monitor.collect_logs()
        df = pd.DataFrame(logs)
        traces = df.groupby("endpoint").agg({"environment": list, "timestamp": "first"}).reset_index()
        flows = [
            {"trace_id": str(i), "endpoints": row["environment"], "environments": [row["environment"]] * len(row["environment"])}
            for i, row in traces.iterrows()
        ]
        logger.info(f"GET /api/request-flow - Flows: {flows}")
        return flows
    except Exception as e:
        logger.error(f"Error in /api/request-flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")
    connection_open = True
    try:
        environments = ["on_prem", "aws_cloud", "multi_cloud"]
        endpoints = ["api1", "api2", "api3"]
        env_index = 0
        endpoint_index = 0
        while True:
            env = environments[env_index]
            endpoint = endpoints[endpoint_index]
            logs = await monitor.collect_logs(endpoint, env)
            if not logs:
                logger.warning(f"No logs collected for {endpoint}_{env}")
                await websocket.send_json([])
                await asyncio.sleep(10)
                endpoint_index = (endpoint_index + 1) % len(endpoints)
                if endpoint_index == 0:
                    env_index = (env_index + 1) % len(environments)
                continue
            df = pd.DataFrame(logs)
            alerts = await monitor.detect_anomalies(df)
            logger.info(f"WebSocket sending alerts for {endpoint}_{env}: {len(alerts)} entries")
            formatted_alerts = [
                {**{k: str(v) if k == "_id" else v for k, v in alert.items()}, **{"id": str(alert["_id"])}}
                for alert in alerts
            ]
            await websocket.send_json(formatted_alerts if formatted_alerts else [])
            await asyncio.sleep(10)
            endpoint_index = (endpoint_index + 1) % len(endpoints)
            if endpoint_index == 0:
                env_index = (env_index + 1) % len(environments)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected gracefully")
        connection_open = False
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        connection_open = False
    finally:
        if connection_open:
            try:
                await websocket.close()
                logger.info("WebSocket connection closed by server")
            except RuntimeError as e:
                logger.error(f"Error closing WebSocket: {e} (likely already closed by client)")

@app.on_event("shutdown")
async def shutdown_event():
    monitor.executor.shutdown(wait=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)