import React from 'react';
import './App.css';
import { AuthProvider } from './shared/contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SystemController } from './components/SystemController';
import { ToastContainer } from './shared/components/Toast';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="App">
          <ProtectedRoute>
            <SystemController />
          </ProtectedRoute>
          <ToastContainer />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
