import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Criar o Contexto
const AuthContext = createContext();

// 2. Criar o Provedor (Componente que busca e armazena os dados)
export function AuthProvider({ children }) {
  const [clientPrincipal, setClientPrincipal] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Esta rota é protegida pelo 'navigationFallback.exclude'
        const res = await fetch('/.auth/me');
        if (res.ok) {
          const data = await res.json();
          const { clientPrincipal } = data;
          
          if (clientPrincipal) {
            setClientPrincipal(clientPrincipal);
            setAccessToken(clientPrincipal.accessToken);
          }
        }
      } catch (error) {
        console.error("Falha ao buscar dados de autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const authData = {
    clientPrincipal,
    accessToken,
    isLoading
  };

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Criar o Hook (o atalho para os componentes usarem os dados)
export const useAuth = () => {
  return useContext(AuthContext);
};