import React, { useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig"; 
import './UploadPage.css';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(''); 
  const [isUploading, setIsUploading] = useState(false);
  
  const { instance, accounts } = useMsal();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type !== "application/pdf") {
      setFeedback("Erro: O arquivo deve ser um .pdf");
      setSelectedFile(null);
      return;
    }
    setFeedback(file ? `Arquivo selecionado: ${file.name}` : '');
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
        setFeedback("Por favor, selecione um arquivo PDF primeiro.");
        return;
    }

    setIsUploading(true);
    setFeedback("Adquirindo token de autenticação...");

    let token = null;

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0] 
      });
      token = tokenResponse.accessToken;
    } catch (err) {
      // --- INÍCIO DA CORREÇÃO (MSAL-R) ---
      // Corrigido: 'logging.warn' para 'console.warn'
      console.warn("Aquisição silenciosa falhou, tentando redirecionamento: ", err);
      // --- FIM DA CORREÇÃO ---
      try {
        await instance.acquireTokenRedirect({
          ...loginRequest,
          account: accounts[0]
        });
        return; 
      } catch (redirectErr) {
        setFeedback("Erro crítico: Falha ao adquirir token. Tente fazer login novamente.");
        setIsUploading(false);
        return;
      }
    }

    if (!token) {
      setFeedback("Erro: Token não adquirido.");
      setIsUploading(false);
      return;
    }

    setFeedback("Enviando... por favor, aguarde.");
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
        setFeedback(`Erro: ${result.error || 'Falha ao enviar.'}`);
      } else {
        setFeedback(`Sucesso: ${result.message}`);
        setSelectedFile(null);
        if (document.getElementById('file-input')) {
            document.getElementById('file-input').value = "";
        }
      }

    } catch (err) {
      console.error("Erro de rede ou fetch:", err);
      setFeedback("Erro de conexão ou CORS. Verifique o console (F12) e a configuração do backend.");
    } finally {
      setIsUploading(false);
    }
  };

  // ... (O JSX 'return' permanece o mesmo) ...
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

      {feedback && (
        <div className="feedback-message">
          {feedback}
        </div>
      )}
    </div>
  );
}

export default UploadPage;