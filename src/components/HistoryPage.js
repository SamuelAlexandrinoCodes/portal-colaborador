import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- NOSSO NOVO HOOK
import './HistoryPage.css';

function HistoryPage() {
  const [documents, setDocuments] = useState([]);
  const [feedback, setFeedback] = useState('Carregando seu histórico...');
  const { accessToken, clientPrincipal } = useAuth(); // Obter o token

  useEffect(() => {
    // Não tente buscar se o token ainda não estiver disponível
    if (!accessToken) {
      if (!clientPrincipal) {
        setFeedback("Erro: Autenticação não encontrada.");
      }
      return;
    }

    (async () => {
      try {
        const backendUrl = "https://saofunc-backendtrigger-fraud.azurewebsites.net/api/history";
        
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${accessToken}`);

        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: headers,
        });

        const result = await response.json();

        if (!response.ok) {
          setFeedback(`Erro: ${result.error || 'Falha ao buscar histórico.'}`);
        } else {
          setDocuments(result.documents || []);
          setFeedback(result.documents.length === 0 ? "Nenhum documento encontrado." : "");
        }

      } catch (err) {
        console.error("Erro de rede ou fetch:", err);
        setFeedback("Erro de conexão. Verifique sua rede.");
      }
    })();
  }, [accessToken, clientPrincipal]); // Executar quando o token estiver disponível

  return (
    <div className="page-container">
      <h2>Meus Documentos (REQ-06)</h2>
      
      {feedback && <div className="feedback-message">{feedback}</div>}

      <div className="history-list">
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Status</th>
              <th>Paciente</th>
              <th>Data de Envio</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>{doc.filename || 'N/A'}</td>
                <td>{doc.status_processamento || 'N/A'}</td>
                <td>{doc.nome_paciente || 'N/A'}</td>
                <td>{new Date(doc.upload_timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryPage;