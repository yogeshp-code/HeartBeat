import json
import time
import threading
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from itertools import islice
import boto3
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Cookie, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
from jwt import PyJWTError, ExpiredSignatureError
from dotenv import load_dotenv
from auth.routes import router as auth_router
import logging

app = FastAPI(title="ECS Monitoring API")
app.include_router(auth_router)
refresh_status = {}
load_dotenv()
logger = logging.getLogger("uvicorn.error")

# !!! HIGHLIGHT: ENV-SPECIFIC CONFIG - DO NOT HARDCODE IN PRODUCTION !!!
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")  
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "your_jwt_algorithm")

class SessionData(BaseModel):
    class Config:
        extra = "allow"  
    sub: str
    user_id: str
    role: str

class JWTBearer(HTTPBearer):
    async def __call__(self, request: Request):
        token = request.cookies.get("session_token")
        if not token:
            credentials = await super().__call__(request)
            if credentials:
                token = credentials.credentials
        if not token:
            raise HTTPException(status_code=401, detail="Missing credentials")
        return token

def verify_jwt(token: str = Depends(JWTBearer())):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return SessionData(**payload)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

CONFIG_FILE = "config.json"
profiles_config = {}
clusters_data = {}
last_update_time = {}

class ClusterService(BaseModel):
    account_alias: str
    cluster_name: str
    service_name: str
    running_tasks: int
    current_cpu: float
    current_memory: float
    historical_cpu: List[float] = []
    historical_memory: List[float] = []
    last_updated: str

class HealthResponse(BaseModel):
    status: str

class ServiceDetailsResponse(BaseModel):
    service_overview: Dict[str, Any]
    deployment_info: Dict[str, Any]
    current_tasks: Dict[str, Any]
    events: Dict[str, List[Dict[str, Any]]]
    configuration: Dict[str, Any]

def load_config():
    global profiles_config
    try:
        with open(CONFIG_FILE, "r") as f:
            profiles_config = json.load(f)
    except Exception as e:
        profiles_config = {"dev": "dev-profile", "prod": "prod-profile"}

def refresh_data_for_alias(alias: str, profile_name: str):
    global clusters_data, last_update_time, refresh_status
    refresh_status[alias] = {"in_progress": True, "status": "Refresh in progress"}
    try:
        services_data = fetch_ecs_data(alias, profile_name)
        clusters_data[alias] = services_data
        last_update_time[alias] = datetime.utcnow().isoformat()
        refresh_status[alias]["status"] = "Refresh completed"
    except Exception as e:
        refresh_status[alias]["status"] = f"Refresh failed: {e}"
    finally:
        refresh_status[alias]["in_progress"] = False

def get_cloudwatch_metrics(cloudwatch, cluster_name, service_name, start_time, end_time, period=300):
    try:
        cpu_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/ECS",
            MetricName="CPUUtilization",
            Dimensions=[
                {"Name": "ClusterName", "Value": cluster_name},
                {"Name": "ServiceName", "Value": service_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=["Maximum"]
        )
        memory_response = cloudwatch.get_metric_statistics(
            Namespace="AWS/ECS",
            MetricName="MemoryUtilization",
            Dimensions=[
                {"Name": "ClusterName", "Value": cluster_name},
                {"Name": "ServiceName", "Value": service_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=["Maximum"]
        )
        cpu_datapoints = sorted(cpu_response.get("Datapoints", []), key=lambda x: x["Timestamp"])
        memory_datapoints = sorted(memory_response.get("Datapoints", []), key=lambda x: x["Timestamp"])
        cpu_values = [dp.get("Maximum", 0) for dp in cpu_datapoints]
        memory_values = [dp.get("Maximum", 0) for dp in memory_datapoints]
        return cpu_values, memory_values
    except Exception as e:
        return [], []

def safe_datetime_format(dt_value, default_time=None):
    if default_time is None:
        default_time = datetime.utcnow()
    if dt_value is None:
        return default_time.isoformat()
    elif isinstance(dt_value, datetime):
        return dt_value.isoformat()
    elif isinstance(dt_value, str):
        return dt_value
    else:
        return str(dt_value)

def safe_get(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default

def fetch_service_details(alias: str, profile_name: str, cluster_name: str, service_name: str):
    try:
        session = boto3.Session(profile_name=profile_name)
        ecs_client = session.client('ecs')
        cloudwatch = session.client('cloudwatch')
        application_autoscaling = session.client('application-autoscaling')
        current_time = datetime.utcnow()
        service_response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        if not service_response.get('services'):
            raise HTTPException(status_code=404, detail=f"Service {service_name} not found in cluster {cluster_name}")
        service = service_response['services'][0]
        task_def_response = ecs_client.describe_task_definition(
            taskDefinition=service['taskDefinition']
        )
        task_definition = task_def_response['taskDefinition']
        tasks_response = ecs_client.list_tasks(
            cluster=cluster_name,
            serviceName=service_name
        )
        resource_id = f"service/{cluster_name}/{service_name}"
        scaling_history = application_autoscaling.describe_scaling_activities(
            ServiceNamespace='ecs',
            ResourceId=resource_id,
            ScalableDimension='ecs:service:DesiredCount',
            IncludeNotScaledActivities=True
        )
        activities = scaling_history.get('ScalingActivities', [])
        for activity in activities:
            for key in ['StartTime', 'EndTime', 'ScheduledActionName']:
                if key in activity and isinstance(activity[key], datetime):
                    activity[key] = activity[key].isoformat()
        six_hours_ago = current_time - timedelta(hours=6)
        historical_cpu, historical_memory = get_cloudwatch_metrics(
            cloudwatch,
            cluster_name,
            service_name,
            six_hours_ago,
            current_time,
            period=1800
        )
        historical_cpu = historical_cpu[-12:] if len(historical_cpu) >= 12 else historical_cpu + [0] * (12 - len(historical_cpu))
        historical_memory = historical_memory[-12:] if len(historical_memory) >= 12 else historical_memory + [0] * (12 - len(historical_memory))
        task_details = []
        if tasks_response.get('taskArns'):
            tasks_detail_response = ecs_client.describe_tasks(
                cluster=cluster_name,
                tasks=tasks_response['taskArns']
            )
            task_details = tasks_detail_response.get('tasks', [])
        service_events = service.get('events', [])[:10]
        scaling_policies = []
        try:
            autoscaling_response = application_autoscaling.describe_scaling_policies(
                ServiceNamespace='ecs',
                ResourceId=f'service/{cluster_name}/{service_name}'
            )
            scaling_policies = autoscaling_response.get('ScalingPolicies', [])
        except Exception as e:
            pass
        service_overview = {
            "service_arn": service.get('serviceArn', ''),
            "creation_date": safe_datetime_format(service.get('createdAt'), current_time),
            "task_definition": service.get('taskDefinition', ''),
            "desired_count": service.get('desiredCount', 0),
            "launch_type": service.get('launchType', 'UNKNOWN'),
            "platform_version": service.get('platformVersion', 'LATEST'),
            "status": service.get('status', 'UNKNOWN'),
            "historical_cpu": historical_cpu,
            "historical_memory": historical_memory
        }
        deployments = service.get('deployments', [])
        primary_deployment = next((d for d in deployments if isinstance(d, dict) and d.get('status') == 'PRIMARY'), {})
        deployment_info = {
            "current_deployment": {
                "id": safe_get(primary_deployment, 'id', ''),
                "status": safe_get(primary_deployment, 'status', ''),
                "created_at": safe_datetime_format(safe_get(primary_deployment, 'createdAt'), current_time),
                "updated_at": safe_datetime_format(safe_get(primary_deployment, 'updatedAt'), current_time),
                "task_definition": safe_get(primary_deployment, 'taskDefinition', ''),
                "rollout_progress": safe_get(safe_get(primary_deployment, 'rolloutState', {}), 'completedPercent', 0) if isinstance(safe_get(primary_deployment, 'rolloutState'), dict) else 0,
                "running_count": safe_get(primary_deployment, 'runningCount', 0),
                "desired_count": safe_get(primary_deployment, 'desiredCount', 0)
            },
            "deployment_history": []
        }
        for dep in deployments[:5]:
            if isinstance(dep, dict):
                deployment_info["deployment_history"].append({
                    "id": dep.get('id', ''),
                    "status": dep.get('status', ''),
                    "task_definition": dep.get('taskDefinition', ''),
                    "created_at": safe_datetime_format(dep.get('createdAt'), current_time),
                    "completed_at": safe_datetime_format(dep.get('updatedAt'), current_time)
                })
        tasks_info = []
        for task in task_details:
            if isinstance(task, dict):
                task_arn = task.get('taskArn', '')
                task_id = task_arn.split('/')[-1] if task_arn else ''
                container_instance_arn = task.get('containerInstanceArn', '')
                container_instance = container_instance_arn.split('/')[-1] if container_instance_arn else ''
                containers = []
                container_definitions = task_definition.get('containerDefinitions', []) if isinstance(task_definition, dict) else []
                for container in container_definitions:
                    if isinstance(container, dict):
                        containers.append({
                            "name": container.get('name', ''),
                            "image": container.get('image', ''),
                            "cpu": container.get('cpu', 0),
                            "memory": container.get('memory', 0),
                            "essential": container.get('essential', False),
                            "portMappings": container.get('portMappings', [])
                        })
                task_info = {
                    "task_id": task_id,
                    "health_status": task.get('healthStatus', 'UNKNOWN'),
                    "started_at": safe_datetime_format(task.get('startedAt'), current_time),
                    "container_instance": container_instance,
                    "availability_zone": task.get('availabilityZone', ''),
                    "task_definition": {
                        "family": task_definition.get('family', '') if isinstance(task_definition, dict) else '',
                        "revision": task_definition.get('revision', 0) if isinstance(task_definition, dict) else 0,
                        "containers": containers
                    }
                }
                tasks_info.append(task_info)
        current_tasks = {
            "running_count": service.get('runningCount', 0),
            "desired_count": service.get('desiredCount', 0),
            "tasks": tasks_info
        }
        formatted_events = []
        for event in service_events:
            if isinstance(event, dict):
                formatted_events.append({
                    "type": "INFO",
                    "message": event.get('message', ''),
                    "timestamp": safe_datetime_format(event.get('createdAt'), current_time)
                })
        formatted_activities = []
        for activity in activities:
            if isinstance(activity, dict):
                reason = activity.get('NotScaledReasons',[])
                code = reason[0].get('Code') if reason else None
                formatted_activities.append({
                    "activity_id" : activity.get('ActivityId',''),
                    "start_time" : activity.get("StartTime",''),
                    "description" : activity.get("Description",''),
                    "status_code" : activity.get("StatusCode",''),
                    "cause" : activity.get("Cause",''),
                    "reason" : code 
                })
        events = {
            "service_events": formatted_events,
            "scaling_events": formatted_activities
        }
        load_balancers = service.get('loadBalancers', [])
        load_balancer_config = {}
        if load_balancers and isinstance(load_balancers, list) and len(load_balancers) > 0:
            lb = load_balancers[0]
            if isinstance(lb, dict):
                load_balancer_config = {
                    "type": "NETWORK",
                    "target_group_arn": lb.get('targetGroupArn', ''),
                    "config": lb
                }
        auto_scaling_policies = []
        for policy in scaling_policies:
            if isinstance(policy, dict):
                target_tracking_config = policy.get('TargetTrackingScalingPolicyConfiguration', {})
                target_value = 0
                if isinstance(target_tracking_config, dict):
                    target_value = target_tracking_config.get('TargetValue', 0)
                auto_scaling_policies.append({
                    "name": policy.get('PolicyName', ''),
                    "type": policy.get('PolicyType', ''),
                    "target_value": target_value
                })
        auto_scaling_config = {
            "min_capacity": 1,
            "max_capacity": 10,
            "status": "ENABLED" if scaling_policies else "DISABLED",
            "policies": auto_scaling_policies
        }
        network_config = {}
        service_network_config = service.get('networkConfiguration', {})
        if isinstance(service_network_config, dict):
            awsvpc_config = service_network_config.get('awsvpcConfiguration', {})
            if isinstance(awsvpc_config, dict):
                network_config = awsvpc_config
        configuration = {
            "service_definition": {
                "serviceName": service.get('serviceName', ''),
                "taskDefinition": service.get('taskDefinition', ''),
                "desiredCount": service.get('desiredCount', 0),
                "launchType": service.get('launchType', ''),
                "platformVersion": service.get('platformVersion', 'LATEST'),
                "deploymentConfiguration": service.get('deploymentConfiguration', {})
            },
            "load_balancer": load_balancer_config,
            "auto_scaling": auto_scaling_config,
            "network": {
                "network_mode": "awsvpc" if network_config else "bridge",
                "assign_public_ip": network_config.get('assignPublicIp', 'DISABLED') == 'ENABLED' if network_config else False,
                "subnets": network_config.get('subnets', []) if network_config else [],
                "security_groups": network_config.get('securityGroups', []) if network_config else []
            }
        }
        return {
            "service_overview": service_overview,
            "deployment_info": deployment_info,
            "current_tasks": current_tasks,
            "events": events,
            "configuration": configuration
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching service details: {str(e)}")

def fetch_ecs_data(alias, profile_name):
    try:
        session = boto3.Session(profile_name=profile_name)
        ecs_client = session.client('ecs')
        cloudwatch = session.client('cloudwatch')
        cluster_arns = []
        paginator = ecs_client.get_paginator('list_clusters')
        for page in paginator.paginate():
            cluster_arns.extend(page.get('clusterArns', []))
        current_time = datetime.utcnow()
        five_min_ago = current_time - timedelta(minutes=5)
        six_hours_ago = current_time - timedelta(hours=6)
        services_data = []
        for cluster_arn in cluster_arns:
            cluster_name = cluster_arn.split('/')[-1]
            services_response = ecs_client.list_services(cluster=cluster_name)
            service_arns = services_response.get('serviceArns', [])
            if not service_arns:
                continue
            services_details = ecs_client.describe_services(
                cluster=cluster_name,
                services=service_arns
            )
            for service in services_details.get('services', []):
                service_name = service.get('serviceName')
                running_tasks = service.get('runningCount', 0)
                current_cpu_values, current_memory_values = get_cloudwatch_metrics(
                    cloudwatch, 
                    cluster_name, 
                    service_name, 
                    five_min_ago, 
                    current_time
                )
                current_cpu = current_cpu_values[0] if current_cpu_values else 0
                current_memory = current_memory_values[0] if current_memory_values else 0
                historical_cpu = []
                historical_memory = []
                if running_tasks >= 2:
                    historical_cpu, historical_memory = get_cloudwatch_metrics(
                        cloudwatch,
                        cluster_name,
                        service_name,
                        six_hours_ago,
                        current_time,
                        period=1800
                    )
                    historical_cpu = historical_cpu[-12:] if len(historical_cpu) >= 12 else historical_cpu + [0] * (12 - len(historical_cpu))
                    historical_memory = historical_memory[-12:] if len(historical_memory) >= 12 else historical_memory + [0] * (12 - len(historical_memory))
                service_data = {
                    "account_alias": alias,
                    "cluster_name": cluster_name,
                    "service_name": service_name,
                    "running_tasks": running_tasks,
                    "current_cpu": current_cpu,
                    "current_memory": current_memory,
                    "historical_cpu": historical_cpu,
                    "historical_memory": historical_memory,
                    "last_updated": current_time.isoformat()
                }
                services_data.append(service_data)
        return services_data
    except Exception as e:
        return []
    
def update_all_data():
    global clusters_data, last_update_time
    while True:
        try:
            for alias, profile_name in profiles_config.items():
                services_data = fetch_ecs_data(alias, profile_name)
                clusters_data[alias] = services_data
                last_update_time[alias] = datetime.utcnow().isoformat()
            time.sleep(600)
        except Exception as e:
            time.sleep(600)

@app.on_event("startup")
def startup_event():
    load_config()
    update_thread = threading.Thread(target=update_all_data, daemon=True)
    update_thread.start()

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}

@app.get("/aliases", response_model=List[str])
def get_aliases(session_data: SessionData = Depends(verify_jwt)):
    return list(profiles_config.keys())

@app.get("/clusters", response_model=List[ClusterService])
def get_clusters(alias: Optional[str] = None, session_data: SessionData = Depends(verify_jwt)):
    if alias and alias not in profiles_config:
        raise HTTPException(status_code=404, detail=f"Alias {alias} not found")
    result = []
    if alias:
        result = clusters_data.get(alias, [])
    else:
        for alias_data in clusters_data.values():
            result.extend(alias_data)
    return result

@app.get("/service-details", response_model=ServiceDetailsResponse)
def get_service_details(service_name: str, cluster_name: str, alias: str, session_data: SessionData = Depends(verify_jwt)):
    if alias not in profiles_config:
        raise HTTPException(status_code=404, detail=f"Alias '{alias}' not found")
    profile_name = profiles_config[alias]
    try:
        service_details = fetch_service_details(alias, profile_name, cluster_name, service_name)
        response = JSONResponse(content=service_details)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching service details: {str(e)}")

@app.get("/refresh")
def trigger_refresh(alias: str):
    if alias not in profiles_config:
        raise HTTPException(status_code=404, detail=f"Alias '{alias}' not found")
    if alias not in refresh_status:
        refresh_status[alias] = {"in_progress": False, "status": "Not started"}
    if refresh_status[alias]["in_progress"]:
        content = {"message": f"Refresh already in progress for alias '{alias}'"}
        response = JSONResponse(content=content)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
    threading.Thread(
        target=refresh_data_for_alias,
        args=(alias, profiles_config[alias]),
        daemon=True
    ).start()
    content = {"message": f"Refresh triggered for alias '{alias}'"}
    response = JSONResponse(content=content)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.get("/refresh-status")
def get_refresh_status(alias: str):
    if alias not in profiles_config:
        raise HTTPException(status_code=404, detail=f"Alias '{alias}' not found")
    status = refresh_status.get(alias, {"in_progress": False, "status": "Not started"})
    content = {"alias": alias, **status}
    response = JSONResponse(content=content)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

if __name__ == "__main__":
    if not os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "w") as f:
            json.dump({"dev": "dev-profile", "prod": "prod-profile"}, f)
    uvicorn.run(app, host="0.0.0.0", port=8000)