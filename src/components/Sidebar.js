import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMsal } from "@azure/msal-react"; // <-- MSAL
import './Sidebar.css'; 

function Sidebar() {
  // --- INÍCIO DA MUDANÇA (Operação MSAL) ---
  const { instance } = useMsal();

  const handleLogout = () => {
    // 'logoutRedirect' limpa a sessão e redireciona para a página pós-logout (que é a home)
    instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  }
  // --- FIM DA MUDANÇA ---

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3>Portal</h3>
      </div>
      <ul className="sidebar-links">
        <li>
          {/* Mude 'to="/upload"' para 'to="/"' ou '/upload' */}
          <NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}>
            <span>Enviar Documento</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/history" className={({ isActive }) => isActive ? "active-link" : ""}>
            <span>Meus Documentos</span>
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-footer">
        {/* Modificado de <a> para <button> para usar onClick */}
        <button onClick={handleLogout} className="logout-link">
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;