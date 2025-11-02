import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Nossos componentes de página
import LoginPage from './components/LoginPage';
import UploadPage from './components/UploadPage';
import HistoryPage from './components/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute'; // O novo guarda

// (Importe seu Sidebar se ele for separado)
// import Sidebar from './components/Sidebar'; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          {/* O Sidebar agora é renderizado DENTRO das rotas protegidas,
            para que não apareça na página de login.
          */}
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
            
            {/* TODO: Adicionar uma rota "Not Found" 404 */}
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;