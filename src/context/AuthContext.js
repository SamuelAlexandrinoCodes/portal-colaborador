import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [clientPrincipal, setClientPrincipal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.auth/me');
        if (res.ok) {
          const data = await res.json();
          // --- CORREÇÃO v26 ---
          // Simplesmente definimos o clientPrincipal.
          setClientPrincipal(data.clientPrincipal); 
          // --- FIM DA CORREÇÃO ---
        }
      } catch (error) {
        console.error("Falha ao buscar dados de autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // --- CORREÇÃO v26 ---
  const authData = {
    clientPrincipal, // O único valor que precisamos
    isLoading
  };
  // --- FIM DA CORREÇÃO ---

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};