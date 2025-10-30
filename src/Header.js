import React from 'react';

function Header() {
  return (
    <header className="header">
      {/* O nome do usuário virá do login futuramente */}
      <div className="user-info">
        Bem-vindo, Colaborador
      </div>
    </header>
  );
}

export default Header;