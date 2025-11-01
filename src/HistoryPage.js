import React, { useState, useEffect } from 'react';

function HistoryPage() {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      
      const historyUrl = "https://saofunc-backendtrigger-fraud.azurewebsites.net/api/history";

      try {
        // --- AUTENTICAÇÃO REAL (OBRIGATÓRIA) ---
        const authRes = await fetch("/.auth/me");
        const authJson = await authRes.json();
        
        if (!authJson.clientPrincipal) {
          throw new Error("Usuário não logado. Por favor, atualize a página e faça o login.");
        }
        const token = authJson.clientPrincipal.identityToken; 
        // --- FIM DA AUTENTICAÇÃO ---

        const response = await fetch(historyUrl, {
            headers: {
              'Authorization': `Bearer ${token}` 
            }
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Falha ao buscar dados.");
        }

        setDocs(result.documents); // Salva os documentos no estado

      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        setError(err.message);
        setDocs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []); 

  // --- Renderização Tática ---
  
  if (isLoading) {
    return (
      <div className="page-container">
        <h2>Meus Documentos</h2>
        <p>Buscando histórico autenticado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2>Meus Documentos</h2>
        <p style={{ color: 'red' }}><strong>Erro ao carregar:</strong> {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Meus Documentos</h2>
      <p>Total de documentos encontrados para seu usuário: {docs.length}</p>
      
      <table className="history-table">
        <thead>
          <tr>
            <th>Nome do Paciente</th>
            <th>Nome do Arquivo</th>
            <th>Data de Upload</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan="4">Nenhum documento encontrado para seu usuário.</td>
            </tr>
          ) : (
            docs.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.nome_paciente || <em>(N/A)</em>}</td>
                <td>{doc.filename}</td>
                <td>{new Date(doc.upload_timestamp).toLocaleString('pt-BR')}</td>
                <td>{doc.status_processamento || <em>(N/A)</em>}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default HistoryPage;