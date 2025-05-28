import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Components
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/pages/Dashboard'
import Clients from './components/pages/Clients'
import Loans from './components/pages/Loans'
import Payments from './components/pages/Payments'
import Reports from './components/pages/Reports'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode from localStorage if available
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedMode) {
      const darkModeEnabled = savedMode === 'true'
      setIsDarkMode(darkModeEnabled)
      if (darkModeEnabled) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else if (prefersDark) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-secondary-950 text-white' : 'bg-secondary-50 text-secondary-900'}`}>
        <Navbar toggleSidebar={toggleSidebar} isDarkMode={isDarkMode} />
        <Sidebar isOpen={sidebarOpen} onToggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        
        <main 
          className={`pt-16 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:pl-64' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App
