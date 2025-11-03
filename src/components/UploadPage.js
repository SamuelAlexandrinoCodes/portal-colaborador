// /src/components/UploadPage.js (Completo e Refinado)

import React, { useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig"; 
import './UploadPage.css';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  // --- AÇÃO 4: APLICADA (Estado de Feedback granular) ---
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [isUploading, setIsUploading] = useState(false);
  
  const { instance, accounts } = useMsal();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type !== "application/pdf") {
      // --- AÇÃO 4: APLICADA ---
      setFeedback({ message: "Erro: O arquivo deve ser um .pdf", type: 'error' });
      setSelectedFile(null);
      return;
    }
    // --- AÇÃO 4: APLICADA ---
    setFeedback({ 
      message: file ? `Arquivo selecionado: ${file.name}` : '', 
      type: 'info' 
    });
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
        // --- AÇÃO 4: APLICADA ---
        setFeedback({ message: "Por favor, selecione um arquivo PDF primeiro.", type: 'error' });
        return;
    }

    setIsUploading(true);
    // --- AÇÃO 4: APLICADA ---
    setFeedback({ message: "Adquirindo token de autenticação...", type: 'info' });

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
        await instance.acquireTokenRedirect({
          ...loginRequest,
          account: accounts[0]
        });
        return; 
      } catch (redirectErr) {
        // --- AÇÃO 4: APLICADA ---
        setFeedback({ message: "Erro crítico: Falha ao adquirir token. Tente fazer login novamente.", type: 'error' });
        setIsUploading(false);
        return;
      }
    }

    if (!token) {
      // --- AÇÃO 4: APLICADA ---
      setFeedback({ message: "Erro: Token não adquirido.", type: 'error' });
      setIsUploading(false);
      return;
    }

    // --- AÇÃO 4: APLICADA ---
    setFeedback({ message: "Enviando... por favor, aguarde.", type: 'info' });
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const backendUrl = "https://saofunc-backendtrigger-fraud.azurewebsites.net/api/upload";
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // --- AÇÃO 4: APLICADA ---
        setFeedback({ message: `Erro: ${result.error || 'Falha ao enviar.'}`, type: 'error' });
      } else {
        // --- AÇÃO 4: APLICADA ---
        setFeedback({ message: `Sucesso: ${result.message}`, type: 'success' });
        setSelectedFile(null);
        if (document.getElementById('file-input')) {
            document.getElementById('file-input').value = "";
        }
      }

    } catch (err) {
      console.error("Erro de rede ou fetch:", err);
      // --- AÇÃO 4: APLICADA ---
      setFeedback({ message: "Erro de conexão ou CORS. Verifique o console (F12) e a configuração do backend.", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Enviar Laudo Médico</h2>
      <p>Envie seu laudo em formato PDF para análise.</p>
      
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="upload-box">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            id="file-input"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {selectedFile ? "Trocar Arquivo" : "Selecionar Arquivo PDF"}
          </label>
        </div>
        
        <button 
          type="submit" 
          className="upload-button" 
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? "Enviando..." : "Enviar para Análise"}
        </button>
      </form>

      {/* --- AÇÃO 4: APLICADA (Renderização do feedback) --- */}
      {feedback.message && (
        <div className={`feedback-message feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}

export default UploadPage;