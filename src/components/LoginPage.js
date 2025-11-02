import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function LoginPage() {
  const { clientPrincipal, isLoading } = useAuth();

  // Se os dados ainda estão carregando, mostre um feedback
  if (isLoading) {
    return <div className="page-container">Carregando sessão...</div>;
  }

  // Se o usuário já está logado, redirecione para a página principal
  if (clientPrincipal) {
    return <Navigate to="/upload" replace />;
  }

  // Se não está carregando e não está logado, mostre a página de login
  return (
    <div className="page-container login-container">
      <h2>Bem-vindo ao Portal do Colaborador</h2>
      <p>Por favor, faça o login para enviar ou consultar seus documentos.</p>
      
      {/* Este NÃO é um Link do React Router. 
        É um link 'a' normal para forçar um redirecionamento do navegador 
        para o endpoint de autenticação do SWA.
      */}
      <a href="/.auth/login/aad" className="upload-button">
        Fazer Login com Microsoft
      </a>
    </div>
  );
}

export default LoginPage;