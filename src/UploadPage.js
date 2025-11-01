import React, { useState } from 'react';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(''); 
  const [isUploading, setIsUploading] = useState(false);

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

  // --- INÍCIO DA CORREÇÃO (HANDLE SUBMIT v19) ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setFeedback("Por favor, selecione um arquivo PDF primeiro.");
      return;
    }

    setIsUploading(true);
    setFeedback("Obtendo credenciais...");

    // --- PASSO 1: OBTER O TOKEN DE AUTENTICAÇÃO DO SWA ---
    let token = null;
    try {
      const authResponse = await fetch('/.auth/me');
      if (authResponse.ok) {
        const authData = await authResponse.json();
        // O clientPrincipal só existe se o usuário estiver logado
        if (authData && authData.clientPrincipal) {
            token = authData.clientPrincipal.accessToken;
        }
      }
    } catch (e) {
      console.error('Falha ao buscar token de auth:', e);
      setFeedback('Erro crítico: Falha ao obter credenciais. Faça login novamente.');
      setIsUploading(false);
      return;
    }

    if (!token) {
      setFeedback('Erro: Credenciais não encontradas. Sua sessão pode ter expirado. Por favor, atualize a página e tente novamente.');
      setIsUploading(false);
      return;
    }
    // --- FIM DO PASSO 1 ---

    setFeedback("Enviando... por favor, aguarde.");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const backendUrl = "https://saofunc-backendtrigger-fraud.azurewebsites.net/api/upload";

      // --- PASSO 2: CRIAR OS HEADERS E ANEXAR O TOKEN ---
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      // Nota: NÃO definimos 'Content-Type'. O browser fará isso
      // automaticamente para o FormData (multipart/form-data).
      // --- FIM DO PASSO 2 ---

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: headers, // <-- A CORREÇÃO CRÍTICA
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
      // Se o erro for de CORS, ele cairá aqui
      setFeedback("Erro de conexão ou CORS. Verifique o console (F12) e a configuração do backend.");
    } finally {
      setIsUploading(false);
    }
  };
 // --- FIM DA CORREÇÃO ---

// ... (O restante do seu código 'return' permanece o mesmo) ...
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
          disabled={!selectedFile || isUploading} // Melhoria: desabilitar se não houver arquivo
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