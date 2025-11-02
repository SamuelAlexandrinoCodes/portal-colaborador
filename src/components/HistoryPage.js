import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react"; 
import { loginRequest } from "../authConfig"; 
import './HistoryPage.css';

function HistoryPage() {
  const [documents, setDocuments] = useState([]);
  const [feedback, setFeedback] = useState('Adquirindo token...');
  const { instance, accounts } = useMsal();

  useEffect(() => {
    // Só execute se a conta MSAL estiver pronta
    if (!accounts || accounts.length === 0) {
      setFeedback("Aguardando login...");
      return;
    }

    const fetchHistory = async () => {
      let token = null;

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        token = tokenResponse.accessToken;
      } catch (err) {
        // --- CORREÇÃO: Lógica de aquisição de token espelhada ---
        console.warn("Aquisição silenciosa falhou, tentando redirecionamento: ", err);
        try {
          await instance.acquireTokenRedirect({ ...loginRequest, account: accounts[0] });
          return; // O código não continuará
        } catch (redirectErr) {
          setFeedback("Falha ao adquirir token. Tente recarregar a página.");
          return;
        }
      }

      if (!token) {
        setFeedback("Token não encontrado.");
        return;
      }

      setFeedback("Carregando seu histórico...");
      
      try {
        const backendUrl = "https://saofunc-backendtrigger-fraud.azurewebsites.net/api/history";
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);

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
    };

    fetchHistory();
  }, [instance, accounts]); 

  // ... (O JSX 'return' permanece o mesmo) ...
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