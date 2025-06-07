export interface ClusterService {
  account_alias: string
  cluster_name: string
  service_name: string
  running_tasks: number
  pending_tasks: number 
  current_cpu: number
  current_memory: number
  historical_cpu: number[]
  historical_memory: number[]
  last_updated: string
}

export interface ServiceDetails {
  service_overview: {
    service_arn: string
    creation_date: string
    task_definition: string
    desired_count: number
    launch_type: string
  }
  deployment_info: {
    current_deployment: {
      id: string
      status: string
      created_at: string
      updated_at: string
      task_definition: string
      rollout_progress: number
      running_count: number
      desired_count: number
    }
    deployment_history: Array<{
      id: string
      status: string
      task_definition: string
      created_at: string
      completed_at: string | null
    }>
  }
  current_tasks: {
    running_count: number
    desired_count: number
    tasks: Array<{
      task_id: string
      health_status: string
      started_at: string
      container_instance: string
      availability_zone: string
      task_definition: any
    }>
  }
  events: {
    service_events: Array<{
      type: string
      message: string
      timestamp: string
    }>
    scaling_events: Array<{
      timestamp: string
      event_type: string
      from_count: number
      to_count: number
      reason: string
    }>
  }
  configuration: {
    service_definition: any
    load_balancer: {
      type: string
      target_group_arn: string
      config: any
    } | null
    auto_scaling: {
      min_capacity: number
      max_capacity: number
      status: string
      policies: Array<{
        name: string
        type: string
        metric: string
        target_value: number
      }>
    } | null
    network: {
      network_mode: string
      assign_public_ip: boolean
      subnets: string[]
      security_groups: string[]
    }
  }
}
