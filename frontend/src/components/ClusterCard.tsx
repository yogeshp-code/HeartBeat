"use client"

import { ArrowDown, ArrowUp, AlertTriangle, ExternalLink } from "lucide-react"
import type { ClusterService } from "../types"
import MetricsChart from "./MetricsChart"

interface ClusterCardProps {
  cluster: ClusterService
  selectedAlias: string
  onOpenDetails: (service: ClusterService) => void
}

export default function ClusterCard({ cluster, selectedAlias, onOpenDetails }: ClusterCardProps) {
  const isproduction1 = selectedAlias?.toLowerCase().includes("production1") || false
  const isOverloaded = isproduction1 ? cluster.running_tasks > 2 : cluster.running_tasks >= 2

  const isWarning = cluster.running_tasks === 0
  const isNormal = !isOverloaded && !isWarning

  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch (e) {
      return timestamp
    }
  }

  const getCardColor = () => {
    if (isOverloaded)
      return "border-red-300/50 dark:border-red-800/50 bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/20 dark:to-red-800/20"
    if (isWarning)
      return "border-yellow-300/50 dark:border-yellow-800/50 bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 dark:from-yellow-900/20 dark:to-yellow-800/20"
    return "border-green-300/50 dark:border-green-800/50 bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/20 dark:to-green-800/20"
  }

  const getStatusBadgeColor = () => {
    if (isOverloaded) return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
    if (isWarning) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
    return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
  }

  const getStatusText = () => {
    if (isOverloaded) return "Overloaded"
    if (isWarning) return "Warning"
    return "Normal"
  }

  const getStatusIcon = () => {
    if (isOverloaded) return <ArrowUp className="h-4 w-4" />
    if (isWarning) return <AlertTriangle className="h-4 w-4" />
    return <ArrowDown className="h-4 w-4" />
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-md backdrop-blur-md border ${getCardColor()} transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px] cursor-pointer`}
      onClick={() => onOpenDetails(cluster)}
    >
      <div className="absolute top-2 right-2">
        <div className="flex items-center">
          <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{cluster.service_name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cluster: {cluster.cluster_name}</p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadgeColor()}`}
          >
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="text-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`animate-ping absolute h-8 w-8 rounded-full ${
                  isOverloaded ? "bg-red-400/20" : isWarning ? "bg-yellow-400/20" : "bg-green-400/20"
                }`}
              ></div>
            </div>
            <div
              className={`relative z-10 text-3xl font-bold ${
                isOverloaded
                  ? "text-red-600 dark:text-red-400"
                  : isWarning
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-green-600 dark:text-green-400"
              }`}
            >
              {cluster.running_tasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Running Tasks</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md shadow-sm backdrop-blur-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CPU</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {cluster.current_cpu.toFixed(1)}%
              </p>
              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUtilizationColor(cluster.current_cpu)}`}
                  style={{ width: `${Math.min(cluster.current_cpu, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md shadow-sm backdrop-blur-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Memory</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {cluster.current_memory.toFixed(1)}%
              </p>
              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUtilizationColor(cluster.current_memory)}`}
                  style={{ width: `${Math.min(cluster.current_memory, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {isOverloaded && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Historical Data (Last 6 Hours)</p>
            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md shadow-sm backdrop-blur-sm">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">CPU Utilization</p>
                  <MetricsChart data={cluster.historical_cpu} label="CPU" color="#3b82f6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Memory Utilization</p>
                  <MetricsChart data={cluster.historical_memory} label="Memory" color="#ef4444" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span title={formatLastUpdated(cluster.last_updated)}>
            Updated: {formatLastUpdated(cluster.last_updated)}
          </span>
        </div>
      </div>
    </div>
  )
}

function getUtilizationColor(value: number): string {
  if (value > 80) return "bg-red-500"
  if (value > 60) return "bg-yellow-500"
  return "bg-green-500"
}
