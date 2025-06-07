"use client"

import { useState } from "react"
import { Filter, SortAsc, SortDesc, RefreshCw } from "lucide-react"

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export interface FilterOptions {
  status: "all" | "overloaded" | "normal" | "warning"
  sortBy: "tasks" | "name" | "cpu" | "memory"
  sortOrder: "asc" | "desc"
}

export default function FilterBar({ onFilterChange, onRefresh, isRefreshing }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    sortBy: "tasks",
    sortOrder: "desc",
  })

  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === "asc" ? "desc" : "asc"
    handleFilterChange("sortOrder", newOrder)
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            isRefreshing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center">
          <label htmlFor="sortBy" className="mr-2 text-sm text-gray-600 dark:text-gray-300">
            Sort by:
          </label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tasks">Running Tasks</option>
            <option value="name">Service Name</option>
            <option value="cpu">CPU Usage</option>
            <option value="memory">Memory Usage</option>
          </select>
        </div>

        <button
          onClick={toggleSortOrder}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md p-4 mt-2 absolute top-full left-0 z-10 w-64">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Filter by Status</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="all"
                checked={filters.status === "all"}
                onChange={() => handleFilterChange("status", "all")}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">All Services</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="overloaded"
                checked={filters.status === "overloaded"}
                onChange={() => handleFilterChange("status", "overloaded")}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">Overloaded ({">"}2 tasks)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="normal"
                checked={filters.status === "normal"}
                onChange={() => handleFilterChange("status", "normal")}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">Normal (1-2 tasks)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="warning"
                checked={filters.status === "warning"}
                onChange={() => handleFilterChange("status", "warning")}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">Warning (0 tasks)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
