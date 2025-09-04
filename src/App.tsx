import React from 'react';
import './App.css';
import './styles/equipamentos.css'; // Estilos do sistema de equipamentos
import { ProtectedRoute } from './components/ProtectedRoute';
import { SystemController } from './components/SystemController';
import { AuthProvider } from './shared/contexts/AuthContext';

// Componente principal
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <ProtectedRoute>
          <SystemController />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;
