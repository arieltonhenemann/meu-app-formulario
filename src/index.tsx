import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Inicializar o tema salvo antes de renderizar para evitar oscilação de cor (flicker)
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
