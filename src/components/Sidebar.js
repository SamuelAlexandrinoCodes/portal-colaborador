// ... (importações existentes, React, NavLink, etc.)
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
// ... (importe seus ícones)

function Sidebar() {
  // (Lógica existente para 'userDetails' se você buscá-los do useAuth)
  // const { clientPrincipal } = useAuth(); 
  // const userName = clientPrincipal ? clientPrincipal.userDetails : "Usuário";

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        {/* <h3>Portal ({userName})</h3> */}
        <h3>Portal</h3>
      </div>
      <ul className="sidebar-links">
        <li>
          <NavLink to="/upload" className={({ isActive }) => isActive ? "active-link" : ""}>
            {/* <IconUpload /> */}
            <span>Enviar Documento</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={({ isActive }) => isActive ? "active-link" : ""}>
            {/* <IconHistory /> */}
            <span>Meus Documentos</span>
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-footer">
        {/* A CORREÇÃO DO LOGOUT (v21)
          Simplesmente um link 'a' para o endpoint de logout do SWA.
          O SWA cuidará do redirecionamento para '/' (a LoginPage) 
          conforme definido no staticwebapp.config.json.
        */}
        <a href="/.auth/logout" className="logout-link">
          {/* <IconLogout /> */}
          <span>Sair</span>
        </a>
      </div>
    </nav>
  );
}

export default Sidebar;