import React from 'react';
// --- INÍCIO DA CORREÇÃO v23 ---
// REMOVIDO: import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
// --- FIM DA CORREÇÃO v23 ---
import { AuthProvider } from './context/AuthContext';

// Nossos componentes de página
import LoginPage from './components/LoginPage';
import UploadPage from './components/UploadPage';
import HistoryPage from './components/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute'; // O novo guarda

function App() {
  return (
    <AuthProvider>
      {/* --- INÍCIO DA CORREÇÃO v23 --- */}
      {/* O <BrowserRouter> foi removido daqui. 
          Ele agora vive (e deve viver) no arquivo 'src/index.js' */}
      <div className="app-container">
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<LoginPage />} />

          {/* Rotas Protegidas */}
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
      {/* --- FIM DA CORREÇÃO v23 --- */}
    </AuthProvider>
  );
}

export default App;