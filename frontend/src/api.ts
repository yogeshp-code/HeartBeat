import type { ClusterService, ServiceDetails } from "./types"
import { generateMockClusterData } from "./mock-data"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchAliases(): Promise<string[]> {
  try {
    try {
      const response = await fetch(`${API_BASE_URL}/aliases`, {
        credentials: "include", 
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (e) {
      console.warn("Could not connect to backend, using mock data")
    }
    return ["dev", "prod", "staging", "production1"]
  } catch (error) {
    console.error("Error in fetchAliases:", error)
    return ["dev", "prod", "staging", "production1"]
  }
}

export async function fetchClusters(alias?: string): Promise<ClusterService[]> {
  try {
    try {
      const url = alias
        ? `${API_BASE_URL}/clusters?alias=${encodeURIComponent(alias)}`
        : `${API_BASE_URL}/clusters`
      const response = await fetch(url, {
        credentials: "include", 
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (e) {
      console.warn("Could not connect to backend, using mock data")
    }
    return generateMockClusterData(alias || "dev")
  } catch (error) {
    console.error("Error in fetchClusters:", error)
    return generateMockClusterData(alias || "dev")
  }
}

export async function fetchServiceDetails(serviceName: string, clusterName: string, alias: string): Promise<ServiceDetails> {
  try {
    try {
      const response = await fetch(
        `${API_BASE_URL}/service-details?service_name=${encodeURIComponent(serviceName)}&cluster_name=${encodeURIComponent(clusterName)}&alias=${encodeURIComponent(alias)}`,
        {
          credentials: "include", 
        }
      )
      if (response.ok) {
        return await response.json()
      }
    } catch (e) {
      console.warn("Could not connect to backend, using mock data")
    }

    return generateMockServiceDetails(serviceName)
  } catch (error) {
    console.error("Error in fetchServiceDetails:", error)
    return generateMockServiceDetails(serviceName)
  }
}

export async function triggerRefresh(alias: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh?alias=${encodeURIComponent(alias)}`, {
      credentials: "include", 
    })
    return response.ok
  } catch (error) {
    console.error("Error triggering refresh:", error)
    return true
  }
}

export async function checkRefreshStatus(alias: string): Promise<RefreshStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh-status?alias=${encodeURIComponent(alias)}`, {
      credentials: "include", 
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error("Failed to fetch refresh status")
  } catch (error) {
    console.error("Error checking refresh status:", error)

    const timestamp = Date.now()
    const phase = Math.floor((timestamp % 15000) / 5000)

    if (phase === 0) {
      return { in_progress: true, status: "Refresh in progress" }
    } else if (phase === 1) {
      return { in_progress: false, status: "Refresh completed" }
    } else {
      return { in_progress: false, status: "Not started" }
    }
  }
}

function generateMockServiceDetails(serviceName: string): ServiceDetails {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  return {
    service_overview: {
      service_arn: `arn:aws:ecs:us-west-2:123456789012:service/${serviceName}`,
      creation_date: twoDaysAgo.toISOString(),
      task_definition: `${serviceName}-task:3`,
      desired_count: 2,
      launch_type: "FARGATE", 
      historical_cpu: [10, 20, 30, 40, 50, 60],
      historical_memory: [20, 30, 40, 50, 60, 70],
    },
    deployment_info: {
      current_deployment: {
        id: "ecs-svc/9223370536841983742",
        status: "PRIMARY",
        created_at: oneHourAgo.toISOString(),
        updated_at: now.toISOString(),
        task_definition: `${serviceName}-task:3`,
        rollout_progress: 100,
        running_count: 2,
        desired_count: 2,
      },
      deployment_history: [
        {
          id: "ecs-svc/9223370536841983742",
          status: "PRIMARY",
          task_definition: `${serviceName}-task:3`,
          created_at: oneHourAgo.toISOString(),
          completed_at: now.toISOString(),
        },
        {
          id: "ecs-svc/9223370536841983741",
          status: "COMPLETED",
          task_definition: `${serviceName}-task:2`,
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          completed_at: oneHourAgo.toISOString(),
        },
        {
          id: "ecs-svc/9223370536841983740",
          status: "COMPLETED",
          task_definition: `${serviceName}-task:1`,
          created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    current_tasks: {
      running_count: 2,
      desired_count: 2,
      tasks: [
        {
          task_id: "ecs-task/9223370536841983742",
          health_status: "HEALTHY",
          started_at: oneHourAgo.toISOString(),
          container_instance: "i-0123456789abcdef0",
          availability_zone: "us-west-2a",
          task_definition: {
            family: `${serviceName}-task`,
            revision: 3,
            containers: [
              {
                name: "app",
                image: "nginx:latest",
                cpu: 256,
                memory: 512,
                essential: true,
                portMappings: [
                  {
                    containerPort: 80,
                    hostPort: 80,
                    protocol: "tcp",
                  },
                ],
              },
            ],
          },
        },
        {
          task_id: "ecs-task/9223370536841983743",
          health_status: "HEALTHY",
          started_at: oneHourAgo.toISOString(),
          container_instance: "i-0123456789abcdef1",
          availability_zone: "us-west-2b",
          task_definition: {
            family: `${serviceName}-task`,
            revision: 3,
            containers: [
              {
                name: "app",
                image: "nginx:latest",
                cpu: 256,
                memory: 512,
                essential: true,
                portMappings: [
                  {
                    containerPort: 80,
                    hostPort: 80,
                    protocol: "tcp",
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    events: {
      service_events: [
        {
          type: "INFO",
          message: "service became stable.",
          timestamp: now.toISOString(),
        },
        {
          type: "INFO",
          message: "taskSet deployment completed.",
          timestamp: oneHourAgo.toISOString(),
        },
        {
          type: "WARNING",
          message: "task failed to start.",
          timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        },
      ],
      scaling_events: [
        {
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          event_type: "SCALE_OUT",
          from_count: 1,
          to_count: 2,
          reason: "CPU utilization above target",
        },
        {
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          event_type: "SCALE_IN",
          from_count: 2,
          to_count: 1,
          reason: "CPU utilization below target",
        },
      ],
    },
    configuration: {
      service_definition: {
        serviceName: serviceName,
        taskDefinition: `${serviceName}-task:3`,
        desiredCount: 2,
        launchType: "FARGATE",
        platformVersion: "LATEST",
        deploymentConfiguration: {
          maximumPercent: 200,
          minimumHealthyPercent: 100,
        },
      },
      load_balancer: {
        type: "APPLICATION",
        target_group_arn: "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/my-targets/73e2d6bc24d8a067",
        config: {
          containerName: "app",
          containerPort: 80,
          targetGroupArn: "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/my-targets/73e2d6bc24d8a067",
        },
      },
      auto_scaling: {
        min_capacity: 1,
        max_capacity: 4,
        status: "ENABLED",
        policies: [
          {
            name: "cpu-tracking",
            type: "TargetTrackingScaling",
            metric: "ECSServiceAverageCPUUtilization",
            target_value: 70,
          },
          {
            name: "memory-tracking",
            type: "TargetTrackingScaling",
            metric: "ECSServiceAverageMemoryUtilization",
            target_value: 80,
          },
        ],
      },
      network: {
        network_mode: "awsvpc",
        assign_public_ip: true,
        subnets: ["subnet-12345678", "subnet-23456789"],
        security_groups: ["sg-12345678"],
      },
    },
  }
}
