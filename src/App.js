import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; 
import './components/LoginPage.css';

// --- INÍCIO DA MUDANÇA (Operação MSAL) ---
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
// --- FIM DA MUDANÇA ---

// Nossos componentes de página
import UploadPage from './components/UploadPage';
import HistoryPage from './components/HistoryPage';
import Sidebar from './components/Sidebar'; // <-- Importar o Sidebar

// --- NOVO COMPONENTE DE LOGIN ---
function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => {
    // Usar 'loginRedirect' é o padrão para SPAs
    instance.loginRedirect(loginRequest).catch(e => {
      console.error("Falha no loginRedirect: ", e);
    });
  }

  return (
    // Este é o wrapper que o LoginPage.css irá estilizar
    <div className="login-page-wrapper">
      <div className="login-card">
        <h3>Portal do Colaborador</h3>
        <p>Por favor, faça o login para enviar ou consultar seus documentos.</p>
        <button onClick={handleLogin} className="upload-button">
          Fazer Login com Microsoft
        </button>
      </div>
    </div>
  );
}

// --- NOVO COMPONENTE DE LAYOUT PROTEGIDO ---
function ProtectedLayout() {
  // A MSAL garante que este componente só renderize se autenticado
  return (
    <div className="protected-layout">
      <Sidebar />
      <main className="content-area">
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* Rota padrão (pós-login) */}
          <Route path="/" element={<UploadPage />} /> 
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      {/* O UnauthenticatedTemplate mostra o 'LoginPage' */}
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>

      {/* O AuthenticatedTemplate mostra o portal principal */}
      <AuthenticatedTemplate>
        <ProtectedLayout />
      </AuthenticatedTemplate>
    </div>
  );
}

export default App;