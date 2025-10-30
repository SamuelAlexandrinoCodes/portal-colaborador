import React, { useState } from 'react';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  // 'feedback' agora é crucial para a UX
  const [feedback, setFeedback] = useState(''); 
  const [isUploading, setIsUploading] = useState(false); // Para desabilitar o botão

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

  // --- INÍCIO DA MODIFICAÇÃO (HANDLE SUBMIT) ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setFeedback("Por favor, selecione um arquivo PDF primeiro.");
      return;
    }

    setIsUploading(true); // Desabilita o botão
    setFeedback("Enviando... por favor, aguarde.");

    const formData = new FormData();
    formData.append("file", selectedFile); // O nome 'file' deve bater com o req.files.get("file")

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        // O SWA injetará o token de auth automaticamente
      });

      const result = await response.json();

      if (!response.ok) {
        // Erro do backend (400, 401, 500)
        setFeedback(`Erro: ${result.error || 'Falha ao enviar.'}`);
      } else {
        // Sucesso (200)
        setFeedback(`Sucesso: ${result.message}`);
        setSelectedFile(null); // Limpa o formulário
        // TODO: Limpar o input de arquivo (se necessário)
      }

    } catch (err) {
      console.error("Erro de rede ou fetch:", err);
      setFeedback("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setIsUploading(false); // Reabilita o botão
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
          disabled={isUploading}  // <-- A CORREÇÃO CRÍTICA (O USO DA VARIÁVEL)
        >
          {isUploading ? "Enviando..." : "Enviar para Análise"}
        </button>
      </form>

      {/* Feedback para o usuário (RF-004) */}
      {feedback && (
        <div className="feedback-message">
          {feedback}
        </div>
      )}
    </div>
  );
}

export default UploadPage;