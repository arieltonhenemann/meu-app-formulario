import React from 'react';
import { AuthProvider } from './shared/contexts/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { SystemController } from './features/dashboard/SystemController';
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
