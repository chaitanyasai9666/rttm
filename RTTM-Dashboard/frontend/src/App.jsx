import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardLayout from './components/DashboardLayout';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import Login from './components/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout wrapper for authenticated pages
const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes wrapped in MainLayout */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout><DashboardLayout /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/alerts" element={
          <ProtectedRoute>
            <MainLayout><Alerts /></MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout><Settings /></MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
