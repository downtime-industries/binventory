import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import TagPage from './pages/TagPage'
import AreaPage from './pages/AreaPage'
import ContainerPage from './pages/ContainerPage'
import BinPage from './pages/BinPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'

// Route protection component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    // Check if there's a token on app load
    const token = localStorage.getItem('token');
    
    // Add a small delay to prevent flashing of login page
    setTimeout(() => {
      setIsInitializing(false);
    }, 300);
  }, []);
  
  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="tags/:tag" element={<TagPage />} />
        <Route path="areas/:area" element={<AreaPage />} />
        <Route path="containers/:container" element={<ContainerPage />} />
        <Route path="areas/:area/containers/:container" element={<ContainerPage />} />
        <Route path="bins/:bin" element={<BinPage />} />
        <Route path="areas/:area/containers/:container/bins/:bin" element={<BinPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
