import React, { useState } from 'react';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(''); // Feedback local

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    // Validação de tipo de arquivo (RF-002)
    if (file && file.type !== "application/pdf") {
      setFeedback("Erro: O arquivo deve ser um .pdf");
      setSelectedFile(null);
      return;
    }
    
    setFeedback(file ? `Arquivo selecionado: ${file.name}` : '');
    setSelectedFile(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setFeedback("Por favor, selecione um arquivo PDF primeiro.");
      return;
    }

    // --- PONTO DE ATRITO (CAMPANHA 3) ---
    // Conforme a diretriz, não vamos simular (mockar) a chamada de rede.
    // O botão está pronto para a Campanha 3 (Backend).
    
    setFeedback("Lógica de upload ainda não conectada. (Aguardando Backend /api/upload)");
    
    // const formData = new FormData();
    // formData.append("file", selectedFile);
    //
    // fetch("/api/upload", { method: "POST", body: formData })
    //   .then(...)
    //   .catch(...);
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
        
        <button type="submit" className="upload-button">
          Enviar para Análise
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