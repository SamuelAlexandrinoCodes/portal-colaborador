import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react"; 
import { loginRequest } from "../authConfig"; 
import './HistoryPage.css'; // O CSS (v25) que já temos

// --- NOVO SUB-COMPONENTE TÁTICO (REQ-06 v2.0) ---
// Para renderizar o status com cores (Vermelho/Verde/Amarelo)
const StatusBadge = ({ validade, fraude, processamento }) => {
  if (processamento !== "Processado (MSAL)") {
    return <span className="status-badge status-pending">{processamento}</span>;
  }
  if (fraude.startsWith("Rejeitado")) {
    return <span className="status-badge status-invalid">{fraude}</span>;
  }
  if (validade === "Válido") {
    return <span className="status-badge status-valid">Válido</span>;
  }
  if (validade === "Expirado") {
    return <span className="status-badge status-expired">{validade}</span>;
  }
  
  // Fallback
  return <span className="status-badge status-pending">{validade}</span>;
};
// --- FIM DO SUB-COMPONENTE ---


function HistoryPage() {
  const [documents, setDocuments] = useState([]);
  const [feedback, setFeedback] = useState('Adquirindo token...');
  const { instance, accounts } = useMsal();

  useEffect(() => {
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
        console.warn("Aquisição silenciosa falhou, tentando redirecionamento: ", err);
        try {
          await instance.acquireTokenRedirect({ ...loginRequest, account: accounts[0] });
          return; 
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

  return (
    <div className="page-container">
      <h2>Meus Documentos (REQ-06 v2.0)</h2>
      
      {feedback && <div className="feedback-message">{feedback}</div>}

      {/* --- INÍCIO DA CORREÇÃO (REQ-06 v2.0) --- */}
      <div className="history-list">
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Status do Laudo</th>
              <th>Paciente (do PDF)</th>
              <th>Médico (do PDF)</th>
              <th>Definição (do PDF)</th>
              <th>Data de Envio</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>{doc.filename || 'N/A'}</td>
                <td>
                  <StatusBadge 
                    validade={doc.status_validade}
                    fraude={doc.status_fraude}
                    processamento={doc.status_processamento}
                  />
                </td>
                <td>{doc.nome_paciente || 'N/A'}</td>
                <td>{doc.nome_medico || 'N/A'} (ID: {doc.id_medico || 'N/A'})</td>
                <td>{doc.definicao_laudo || 'N/A'}</td>
                <td>{new Date(doc.upload_timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* --- FIM DA CORREÇÃO --- */}
    </div>
  );
}

export default HistoryPage;