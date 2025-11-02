import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// (Importe seu Sidebar aqui)
import Sidebar from './Sidebar'; 

function ProtectedRoute({ children }) {
  const { clientPrincipal, isLoading } = useAuth();

  // 1. Se os dados ainda estão carregando
  if (isLoading) {
    return <div className="page-container">Verificando autenticação...</div>;
  }

  // 2. Se o usuário NÃO está logado, redirecione para o login
  if (!clientPrincipal) {
    return <Navigate to="/" replace />;
  }

  // 3. Se o usuário ESTÁ logado, renderize o layout protegido e a página
  return (
    <div className="protected-layout">
      <Sidebar />
      <main className="content-area">
        {children} {/* Isso renderizará UploadPage ou HistoryPage */}
      </main>
    </div>
  );
}

export default ProtectedRoute;