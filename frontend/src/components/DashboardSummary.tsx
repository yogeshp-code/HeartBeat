import type { ClusterService } from "../types"
import { Activity, AlertTriangle, Box, CheckCircle, Clock } from "lucide-react"

interface DashboardSummaryProps {
  clusters: ClusterService[]
  selectedAlias: string
}

export default function DashboardSummary({ clusters, selectedAlias }: DashboardSummaryProps) {
  const totalServices = clusters.length

  const runningServices = clusters.filter((c) => c.running_tasks > 0).length
  const stoppedServices = clusters.filter((c) => c.running_tasks === 0).length
  const pendingServices = clusters.filter((c) => c.pending_tasks > 0).length

  const isproduction1 = selectedAlias.toLowerCase().includes("production1")
  const criticalAlerts = clusters.filter((c) => (isproduction1 ? c.running_tasks > 2 : c.running_tasks >= 2)).length



  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
     
      <div className="relative overflow-hidden bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-lg shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Services by Status</h3>
            <div className="mt-2 flex items-baseline">
               <p className="text-2xl font-semibold text-gray-900 dark:text-white">{runningServices}</p>
              <p className="ml-1 mr-1 text-sm text-gray-500 dark:text-gray-400">running / </p>
              <p className="text-2xl ml-1font-semibold text-gray-900 dark:text-white"> {totalServices}</p>
              <p className="ml-1 text-sm text-gray-500 dark:text-gray-400">Total  </p>
            </div>
            <div className="mt-2 flex items-baseline">
             
            </div>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">{runningServices}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Running</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md text-center">
            <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{pendingServices}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stoppedServices}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Stopped</div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-lg shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Alerts</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{criticalAlerts}</p>
              <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">overloaded services</p>
            </div>
          </div>
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
        </div>
        <div className="mt-4">
          {criticalAlerts > 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {criticalAlerts} service{criticalAlerts > 1 ? "s" : ""} need{criticalAlerts === 1 ? "s" : ""}{" "}
                  attention
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-sm text-green-600 dark:text-green-400">All services are healthy</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
