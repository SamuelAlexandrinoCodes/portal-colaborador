import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; // <--- Vamos criar este CSS
import Sidebar from './Sidebar';
import Header from './Header';
import UploadPage from './UploadPage';
import HistoryPage from './HistoryPage';
import LogoutPage from './LogoutPage';

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          <Routes>
            {/* Rota padrão e rota de upload */}
            <Route path="/" element={<UploadPage />} />
            <Route path="/upload" element={<UploadPage />} />
            
            {/* Rota de histórico (simples) */}
            <Route path="/historico" element={<HistoryPage />} />
            {/* Rota de logout */}
            <Route path="/logout-success" element={<LogoutPage />} />
            
            {/* TODO: Adicionar mocks para as outras rotas */}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;