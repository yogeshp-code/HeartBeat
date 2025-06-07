"use client"

import { useState, useEffect } from "react"
import { fetchClusters, fetchAliases } from "./api"
import type { ClusterService } from "./types"
import Header from "./components/Header"
import SearchBar from "./components/SearchBar"
import Pagination from "./components/Pagination"
import ClusterCard from "./components/ClusterCard"

function App() {
  const [clusters, setClusters] = useState<ClusterService[]>([])
  const [filteredClusters, setFilteredClusters] = useState<ClusterService[]>([])
  const [aliases, setAliases] = useState<string[]>([])
  const [selectedAlias, setSelectedAlias] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const itemsPerPage = 20

  useEffect(() => {
    const getAliases = async () => {
      try {
        const aliasData = await fetchAliases()
        setAliases(aliasData)
        if (aliasData.length > 0) {
          setSelectedAlias(aliasData[0])
        }
      } catch (err) {
        setError("Failed to fetch account aliases")
        console.error(err)
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
        setError("Failed to fetch cluster data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const intervalId = setInterval(fetchData, 2 * 60 * 1000)

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

    filtered.sort((a, b) => {
      if (a.running_tasks > 2 && b.running_tasks <= 2) return -1
      if (a.running_tasks <= 2 && b.running_tasks > 2) return 1

      return a.cluster_name.localeCompare(b.cluster_name)
    })

    setFilteredClusters(filtered)
    setCurrentPage(1)
  }, [clusters, searchTerm])

  const handleRefresh = async () => {
    if (!selectedAlias) return

    setLoading(true)
    try {
      const data = await fetchClusters(selectedAlias)
      setClusters(data)
      setLastUpdated(new Date().toLocaleString())
      setError(null)
    } catch (err) {
      setError("Failed to fetch cluster data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredClusters.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredClusters.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        aliases={aliases}
        selectedAlias={selectedAlias}
        onAliasChange={setSelectedAlias}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} totalResults={filteredClusters.length} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {currentItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No clusters found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {currentItems.map((cluster, index) => (
                  <ClusterCard key={`${cluster.cluster_name}-${cluster.service_name}-${index}`} cluster={cluster} />
                ))}
              </div>
            )}

            {filteredClusters.length > itemsPerPage && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
