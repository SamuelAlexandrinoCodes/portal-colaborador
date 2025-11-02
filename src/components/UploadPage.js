import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- NOSSO NOVO HOOK

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(''); 
  const [isUploading, setIsUploading] = useState(false);
  
  // --- INÍCIO DA MODIFICAÇÃO (v21) ---
  const { accessToken } = useAuth(); // Obter o token do nosso QG
  // --- FIM DA MODIFICAÇÃO ---

  const handleFileChange = (event) => {
    // ... (lógica existente sem mudança) ...
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

    // --- VERIFICAÇÃO DE TOKEN (v21) ---
    if (!accessToken) {
      setFeedback("Erro crítico: Token de autenticação não encontrado. Tente recarregar a página.");
      return;
    }
    // --- FIM DA VERIFICAÇÃO ---

    setIsUploading(true);
    setFeedback("Enviando... por favor, aguarde.");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const backendUrl = "https://saofunc-backendtrigger-fraud.azurewebsites.net/api/upload";

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${accessToken}`); // <-- Usar o token do hook

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

  // O 'return' (JSX) permanece o mesmo do seu arquivo v18
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