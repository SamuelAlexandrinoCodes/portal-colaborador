import React from 'react';

function HistoryPage() {
  return (
    <div className="page-container">
      <h2>Meus Documentos</h2>
      <p>Aqui você verá o histórico de seus laudos enviados.</p>
      
      <table className="history-table">
        <thead>
          <tr>
            <th>Nome do Arquivo</th>
            <th>Data de Envio</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>laudo_exemplo_01.pdf</td>
            <td>29/10/2025</td>
            <td>Processado (Mock)</td>
          </tr>
           <tr>
            <td>laudo_exemplo_02.pdf</td>
            <td>28/10/2025</td>
            <td>Em Análise (Mock)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default HistoryPage;