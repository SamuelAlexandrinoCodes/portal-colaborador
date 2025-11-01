import React from 'react';

// Esta é uma página simples e "burra" que não faz chamadas de API.
// Seu único propósito é dar ao usuário um lugar para "pousar" fora do Muro.
function LogoutPage() {
  return (
    <div className="page-container" style={{ textAlign: 'center' }}>
      <h2>Você saiu.</h2>
      <p>Sua sessão foi encerrada com sucesso.</p>
      <a 
        href="/.auth/login/aad" 
        className="upload-button" 
        style={{ textDecoration: 'none' }}
      >
        Fazer Login Novamente
      </a>
    </div>
  );
}

export default LogoutPage;