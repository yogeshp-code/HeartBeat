"use client"

import { useState, useEffect, useRef } from "react"
import { fetchClusters, fetchAliases, checkRefreshStatus } from "../src/api"
import type { ClusterService } from "../src/types"
import Header from "../src/components/Header"
import SearchBar from "../src/components/SearchBar"
import Pagination from "../src/components/Pagination"
import ClusterCard from "../src/components/ClusterCard"
import { ThemeProvider } from "../src/components/ThemeProvider"
import DashboardSummary from "../src/components/DashboardSummary"
import FilterBar, { type FilterOptions } from "../src/components/FilterBar"
import Footer from "../src/components/Footer"
import KeyboardShortcuts from "../src/components/KeyboardShortcuts"
import { ToastContainer } from "../src/components/ToastContainer"
import ServiceDetailModal from "../src/components/ServiceDetailModal"
import ProtectedRoute from "../src/components/ProtectedRoute"

export default function Home() {
  const [clusters, setClusters] = useState<ClusterService[]>([])
  const [filteredClusters, setFilteredClusters] = useState<ClusterService[]>([])
  const [aliases, setAliases] = useState<string[]>([])
  const [selectedAlias, setSelectedAlias] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: "all",
    sortBy: "tasks",
    sortOrder: "desc",
  })
  const [selectedService, setSelectedService] = useState<ClusterService | null>(null)
  const [autoRotateAliases, setAutoRotateAliases] = useState<boolean>(true)
  const [rotationInterval, setRotationInterval] = useState<number>(10000)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const refreshPollingRef = useRef<NodeJS.Timeout | null>(null)
  const itemsPerPage = 20

  useEffect(() => {
    if (!autoRotateAliases || aliases.length <= 1 || selectedService || isRefreshing) return

    const intervalId = setInterval(() => {
      setSelectedAlias(prevAlias => {
        const currentIndex = aliases.indexOf(prevAlias)
        const nextIndex = (currentIndex + 1) % aliases.length
        return aliases[nextIndex]
      })
    }, rotationInterval)

    return () => clearInterval(intervalId)
  }, [aliases, autoRotateAliases, rotationInterval, selectedService, isRefreshing])

  const handleOpenServiceDetails = (service: ClusterService) => {
    setSelectedService(service)
    setAutoRotateAliases(false)
  }

  const handleCloseServiceDetails = () => {
    setSelectedService(null)
    setAutoRotateAliases(true)
  }

  useEffect(() => {
    const getAliases = async () => {
      try {
        const aliasData = await fetchAliases()
        setAliases(aliasData)
        if (aliasData.length > 0) {
          setSelectedAlias(aliasData[0])
        }
      } catch (err) {
        console.error("Error fetching aliases:", err)
        const fallbackAliases = ["dev", "prod", "staging", "production1"]
        setAliases(fallbackAliases)
        setSelectedAlias(fallbackAliases[0])
      }
    }

    getAliases()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedAlias) return

      setLoading(true)
      try {
        const data = await fetchClusters(selectedAlias)
        setClusters(data)
        setLastUpdated(new Date().toLocaleString())
        setError(null)
      } catch (err) {
        console.error("Error fetching cluster data:", err)
        setError("Failed to fetch cluster data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const intervalId = setInterval(fetchData, 10 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [selectedAlias])

  useEffect(() => {
    let filtered = [...clusters]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (cluster) =>
          cluster.cluster_name.toLowerCase().includes(term) || cluster.service_name.toLowerCase().includes(term),
      )
    }

    if (filterOptions.status !== "all") {
      if (filterOptions.status === "overloaded") {
        const isproduction1 = selectedAlias?.toLowerCase().includes("production1") || false
        filtered = filtered.filter((c) => (isproduction1 ? c.running_tasks > 2 : c.running_tasks >= 2))
      } else if (filterOptions.status === "warning") {
        filtered = filtered.filter((c) => c.running_tasks === 0)
      } else if (filterOptions.status === "normal") {
        const isproduction1 = selectedAlias?.toLowerCase().includes("production1") || false
        filtered = filtered.filter(
          (c) => c.running_tasks > 0 && (isproduction1 ? c.running_tasks <= 2 : c.running_tasks < 2),
        )
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0

      const isproduction1 = selectedAlias?.toLowerCase().includes("production1") || false
      const aIsOverloaded = isproduction1 ? a.running_tasks > 2 : a.running_tasks >= 2
      const bIsOverloaded = isproduction1 ? b.running_tasks > 2 : b.running_tasks >= 2
      const aIsWarning = a.running_tasks === 0
      const bIsWarning = b.running_tasks === 0

      const aStatus = aIsOverloaded ? 3 : aIsWarning ? 1 : 2
      const bStatus = bIsOverloaded ? 3 : bIsWarning ? 1 : 2

      comparison = bStatus - aStatus

      if (comparison === 0 || filterOptions.status !== "all") {
        switch (filterOptions.sortBy) {
          case "tasks":
            comparison = b.running_tasks - a.running_tasks
            break
          case "name":
            comparison = a.service_name.localeCompare(b.service_name)
            break
          case "cpu":
            comparison = b.current_cpu - a.current_cpu
            break
          case "memory":
            comparison = b.current_memory - a.current_memory
            break
        }

        if (filterOptions.sortOrder === "asc") {
          comparison = -comparison
        }
      }

      return comparison
    })

    setFilteredClusters(filtered)
    setCurrentPage(1)
  }, [clusters, searchTerm, filterOptions, selectedAlias])

  const startRefreshPolling = (alias: string) => {
    setIsRefreshing(true)

    if (refreshPollingRef.current) {
      clearInterval(refreshPollingRef.current)
    }

    refreshPollingRef.current = setInterval(async () => {
      try {
        const status = await checkRefreshStatus(alias)

        if (status.in_progress) {
          window.toast?.info("Refresh in progress...", status.status)
        } else {
          if (refreshPollingRef.current) {
            clearInterval(refreshPollingRef.current)
            refreshPollingRef.current = null
          }

          if (status.status === "Refresh completed") {
            window.toast?.success("Refresh completed successfully!")
            const data = await fetchClusters(alias)
            setClusters(data)
            setLastUpdated(new Date().toLocaleString())
            setAutoRotateAliases(true)
          } else if (status.status === "Refresh failed") {
            window.toast?.error("Refresh failed", "Please try again")
          } else if (status.status === "Not started") {
            window.toast?.info("Refresh not started")
          }

          setIsRefreshing(false)
        }
      } catch (error) {
        console.error("Error checking refresh status:", error)
        window.toast?.error("Error checking refresh status")

        if (refreshPollingRef.current) {
          clearInterval(refreshPollingRef.current)
          refreshPollingRef.current = null
        }

        setIsRefreshing(false)
      }
    }, 5000)
  }

  useEffect(() => {
    return () => {
      if (refreshPollingRef.current) {
        clearInterval(refreshPollingRef.current)
      }
    }
  }, [])

  const handleRefresh = async () => {
    if (!selectedAlias) return

    setAutoRotateAliases(false)
    startRefreshPolling(selectedAlias)
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilterOptions(newFilters)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current.focus()
      }

      if (
        e.key === "d" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        document.dispatchEvent(new CustomEvent("theme:toggle"))
      }
    }

    const handleRefreshEvent = () => {
      handleRefresh()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("app:refresh", handleRefreshEvent)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("app:refresh", handleRefreshEvent)
    }
  }, [])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredClusters.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredClusters.length / itemsPerPage)

  return (
    <ProtectedRoute>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-auto dark:bg-gray-950/80 transition-colors pb-16">
          <Header
            aliases={aliases}
            selectedAlias={selectedAlias}
            onAliasChange={(alias) => {
              setSelectedAlias(alias)
              setAutoRotateAliases(false)
            }}
            onRefresh={handleRefresh}
            lastUpdated={lastUpdated}
            startRefreshPolling={startRefreshPolling}
            isRefreshing={isRefreshing}
            autoRotate={autoRotateAliases}
            onToggleAutoRotate={() => setAutoRotateAliases(prev => !prev)}
          />

          <main className="container mx-auto px-4 py-8 flex-grow">
            {error && (
              <div
                className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6"
                role="alert"
              >
                <p>{error}</p>
              </div>
            )}

            {!loading && <DashboardSummary clusters={clusters} selectedAlias={selectedAlias} />}

            <div className="relative">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                totalResults={filteredClusters.length}
                ref={searchInputRef}
              />

              <FilterBar onFilterChange={handleFilterChange} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {currentItems.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No clusters found</p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    {currentItems.map((cluster, index) => (
                      <ClusterCard
                        key={`${cluster.cluster_name}-${cluster.service_name}-${index}`}
                        cluster={cluster}
                        selectedAlias={selectedAlias}
                        onOpenDetails={handleOpenServiceDetails}
                      />
                    ))}
                  </div>
                )}
                {filteredClusters.length > itemsPerPage && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                )}
              </>
            )}
          </main>

          {/* <Footer /> */}
          <KeyboardShortcuts />
          <ToastContainer />

          <ServiceDetailModal service={selectedService} onClose={handleCloseServiceDetails} />
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  )
}
