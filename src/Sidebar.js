import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3>Portal Mock</h3>
        <span>(Empresa XYZ)</span>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/upload">
            Enviar Laudo Médico
          </NavLink>
        </li>
        <li>
          <NavLink to="/historico">
            Meus Documentos
          </NavLink>
        </li>
        {/* Links desabilitados para dar "ar profissional" */}
        <li className="disabled-link">
          <span>Dashboard (Mock)</span>
        </li>
        <li className="disabled-link">
          <span>Minha Equipe (Mock)</span>
        </li>
      </ul>
      <div className="sidebar-footer">
        <a href="/.auth/logout?post_logout_redirect_uri=/logout-success">Sair</a>
      </div>
    </nav>
  );
}

export default Sidebar;