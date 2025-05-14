import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { authAPI } from '../../api/api'
import SearchBar from './SearchBar'
import { MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/outline'

const Header = () => {
  const { darkMode, toggleDarkMode } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const handleLogout = () => {
    authAPI.logout();
  }

  return (
    <header className="bg-white shadow-sm dark:bg-gray-800 transition-colors duration-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Binventory</span>
            </Link>
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <SearchBar />
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <MoonIcon className="h-6 w-6 text-gray-700" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t dark:border-gray-700">
            <SearchBar />
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-700" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Log out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
