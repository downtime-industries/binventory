import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon as SearchIcon } from '@heroicons/react/24/outline'
import { useSearchAutocomplete } from '../../hooks/useSearchAutocomplete'

const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useSearchAutocomplete(query)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle key navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    // Arrow up
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? 0 : prev - 1))
    }
    // Arrow down
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const totalItems = getTotalItems()
      setHighlightedIndex((prev) => (prev >= totalItems - 1 ? totalItems - 1 : prev + 1))
    }
    // Tab
    else if (e.key === 'Tab') {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        selectHighlightedItem()
      }
    }
    // Enter
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        selectHighlightedItem()
      } else {
        handleSearch()
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Get total number of items in the dropdown
  const getTotalItems = () => {
    if (!data) return 0
    return (
      (data.items?.length || 0) +
      (data.areas?.length || 0) +
      (data.containers?.length || 0) +
      (data.bins?.length || 0) +
      (data.tags?.length || 0)
    )
  }

  // Select the currently highlighted item
  const selectHighlightedItem = () => {
    if (!data) return

    let currentIndex = 0
    
    // Check if it's in items
    if (data.items && highlightedIndex < data.items.length) {
      setQuery(data.items[highlightedIndex])
      setIsOpen(false)
      return
    }
    currentIndex += data.items?.length || 0
    
    // Check if it's in areas
    if (data.areas && highlightedIndex < currentIndex + data.areas.length) {
      const areaIndex = highlightedIndex - currentIndex
      navigate(`/areas/${data.areas[areaIndex]}`)
      setIsOpen(false)
      return
    }
    currentIndex += data.areas?.length || 0
    
    // Check if it's in containers
    if (data.containers && highlightedIndex < currentIndex + data.containers.length) {
      const containerIndex = highlightedIndex - currentIndex
      navigate(`/containers/${data.containers[containerIndex]}`)
      setIsOpen(false)
      return
    }
    currentIndex += data.containers?.length || 0
    
    // Check if it's in bins
    if (data.bins && highlightedIndex < currentIndex + data.bins.length) {
      const binIndex = highlightedIndex - currentIndex
      navigate(`/bins/${data.bins[binIndex]}`)
      setIsOpen(false)
      return
    }
    currentIndex += data.bins?.length || 0
    
    // Check if it's in tags
    if (data.tags && highlightedIndex < currentIndex + data.tags.length) {
      const tagIndex = highlightedIndex - currentIndex
      navigate(`/tags/${data.tags[tagIndex]}`)
      setIsOpen(false)
      return
    }
  }

  // Handle search submission
  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search items, tags, areas..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(e.target.value.length > 0)
            setHighlightedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        {query && (
          <button
            onClick={handleSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Search
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-96 overflow-y-auto border dark:border-gray-700"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="py-2">
              {/* Items */}
              {data?.items && data.items.length > 0 && (
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Items
                  </h3>
                  {data.items.map((item, index) => (
                    <div
                      key={`item-${index}`}
                      className={`px-3 py-2 cursor-pointer ${
                        index === highlightedIndex
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setQuery(item)
                        setIsOpen(false)
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* Areas */}
              {data?.areas && data.areas.length > 0 && (
                <div className="px-3 py-1 border-t dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Areas
                  </h3>
                  {data.areas.map((area, index) => (
                    <div
                      key={`area-${index}`}
                      className={`px-3 py-2 cursor-pointer ${
                        index + (data.items?.length || 0) === highlightedIndex
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        navigate(`/areas/${area}`)
                        setIsOpen(false)
                      }}
                    >
                      Area: {area}
                    </div>
                  ))}
                </div>
              )}

              {/* Containers */}
              {data?.containers && data.containers.length > 0 && (
                <div className="px-3 py-1 border-t dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Containers
                  </h3>
                  {data.containers.map((container, index) => (
                    <div
                      key={`container-${index}`}
                      className={`px-3 py-2 cursor-pointer ${
                        index + (data.items?.length || 0) + (data.areas?.length || 0) === highlightedIndex
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        navigate(`/containers/${container}`)
                        setIsOpen(false)
                      }}
                    >
                      Container: {container}
                    </div>
                  ))}
                </div>
              )}

              {/* Bins */}
              {data?.bins && data.bins.length > 0 && (
                <div className="px-3 py-1 border-t dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Bins
                  </h3>
                  {data.bins.map((bin, index) => (
                    <div
                      key={`bin-${index}`}
                      className={`px-3 py-2 cursor-pointer ${
                        index +
                          (data.items?.length || 0) +
                          (data.areas?.length || 0) +
                          (data.containers?.length || 0) ===
                        highlightedIndex
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        navigate(`/bins/${bin}`)
                        setIsOpen(false)
                      }}
                    >
                      Bin: {bin}
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {data?.tags && data.tags.length > 0 && (
                <div className="px-3 py-1 border-t dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tags
                  </h3>
                  {data.tags.map((tag, index) => (
                    <div
                      key={`tag-${index}`}
                      className={`px-3 py-2 cursor-pointer ${
                        index +
                          (data.items?.length || 0) +
                          (data.areas?.length || 0) +
                          (data.containers?.length || 0) +
                          (data.bins?.length || 0) ===
                        highlightedIndex
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        navigate(`/tags/${tag}`)
                        setIsOpen(false)
                      }}
                    >
                      Tag: {tag}
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {(!data ||
                ((!data.items || data.items.length === 0) &&
                  (!data.areas || data.areas.length === 0) &&
                  (!data.containers || data.containers.length === 0) &&
                  (!data.bins || data.bins.length === 0) &&
                  (!data.tags || data.tags.length === 0))) && (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
