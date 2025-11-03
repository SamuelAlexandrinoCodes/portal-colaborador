// /src/components/HistoryPage.js (Completo e Refinado)

import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react"; 
import { loginRequest } from "../authConfig"; 
import './HistoryPage.css';

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
  
  return <span className="status-badge status-pending">{validade}</span>;
};


function HistoryPage() {
  const [documents, setDocuments] = useState([]);
  // --- AÇÃO 4: APLICADA (Feedback mais granular) ---
  const [feedback, setFeedback] = useState({ message: 'Adquirindo token...', type: 'info' });
  const { instance, accounts } = useMsal();

  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      setFeedback({ message: "Aguardando login...", type: 'info' });
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
          setFeedback({ message: "Falha ao adquirir token. Tente recarregar a página.", type: 'error' });
          return;
        }
      }

      if (!token) {
        setFeedback({ message: "Token não encontrado.", type: 'error' });
        return;
      }

      setFeedback({ message: "Carregando seu histórico...", type: 'info' });
      
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
          setFeedback({ message: `Erro: ${result.error || 'Falha ao buscar histórico.'}`, type: 'error' });
        } else {
          setDocuments(result.documents || []);
          if (result.documents.length === 0) {
            setFeedback({ message: "Nenhum documento encontrado.", type: 'info' });
          } else {
            setFeedback({ message: '', type: 'info' }); // Limpa o feedback em caso de sucesso
          }
        }

      } catch (err) {
        console.error("Erro de rede ou fetch:", err);
        setFeedback({ message: "Erro de conexão. Verifique sua rede.", type: 'error' });
      }
    };

    fetchHistory();
  }, [instance, accounts]); 

  return (
    <div className="page-container">
      <h2>Meus Documentos</h2>
      
      {/* --- AÇÃO 4: APLICADA --- */}
      {feedback.message && (
        <div className={`feedback-message feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

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
            {/* --- AÇÃO 1: APLICADA (data-label) --- */}
            {documents.map(doc => (
              <tr key={doc.id}>
                <td data-label="Arquivo">{doc.filename || 'N/A'}</td>
                <td data-label="Status do Laudo">
                  <StatusBadge 
                    validade={doc.status_validade}
                    fraude={doc.status_fraude}
                    processamento={doc.status_processamento}
                  />
                </td>
                <td data-label="Paciente">{doc.nome_paciente || 'N/A'}</td>
                <td data-label="Médico">{doc.nome_medico || 'N/A'} (ID: {doc.id_medico || 'N/A'})</td>
                <td data-label="Definição">{doc.definicao_laudo || 'N/A'}</td>
                <td data-label="Data de Envio">{new Date(doc.upload_timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryPage;