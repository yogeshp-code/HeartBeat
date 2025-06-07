import type { ClusterService } from "./types"


export function generateMockClusterData(alias: string): ClusterService[] {
  const clusters = ["main-cluster", "api-cluster", "worker-cluster"]
  const services = [
    "web-service",
    "api-service",
    "auth-service",
    "worker-service",
    "queue-service",
    "cache-service",
    "database-service",
    "logging-service",
    "monitoring-service",
  ]

  const result: ClusterService[] = []

  for (let i = 0; i < 15; i++) {
    const clusterName = clusters[Math.floor(Math.random() * clusters.length)]
    const serviceName = services[Math.floor(Math.random() * services.length)]
    const runningTasks = Math.floor(Math.random() * 5) + 1 // 1-5 tasks
    const pendingTasks = Math.floor(Math.random() * 3) // 0-2 pending tasks

    const currentCpu = Math.random() * 80 + 10 // 10-90%
    const currentMemory = Math.random() * 80 + 10 // 10-90%

    const historicalCpu = Array.from({ length: 12 }, () => Math.random() * 80 + 10)
    const historicalMemory = Array.from({ length: 12 }, () => Math.random() * 80 + 10)

    result.push({
      account_alias: alias,
      cluster_name: `${alias}-${clusterName}`,
      service_name: `${serviceName}-${i}`,
      running_tasks: runningTasks,
      pending_tasks: pendingTasks,
      current_cpu: currentCpu,
      current_memory: currentMemory,
      historical_cpu: historicalCpu,
      historical_memory: historicalMemory,
      last_updated: new Date().toISOString(),
    })
  }

  return result
}
