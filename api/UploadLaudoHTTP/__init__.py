import logging
import os
import uuid
import json
import base64
import azure.functions as func
from azure.storage.blob import BlobServiceClient

# --- Inicialização Global ---
# Clientes e variáveis serão carregados pelo runtime do SWA (das Configs)
connect_str = os.environ.get("AzureWebJobsStorage")
blob_service_client = None
if connect_str:
    blob_service_client = BlobServiceClient.from_connection_string(connect_str)

# --- Helpers ---
def get_user_id_from_swa(req: func.HttpRequest):
    header = req.headers.get("x-ms-client-principal")
    if not header: return None
    try:
        decoded_token = base64.b64decode(header).decode('utf-8')
        token_json = json.loads(decoded_token)
        return token_json.get("userDetails") # e-mail ou nome
    except Exception: return None

# --- Função Principal (Modelo V1) ---
def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Ponte HTTP 'UploadLaudoHTTP' (v1) acionada.")

    user_id = get_user_id_from_swa(req)
    if not user_id:
        return func.HttpResponse(json.dumps({"error": "Não autorizado."}), status_code=401, mimetype="application/json")
    
    try:
        file = req.files.get("file")
        if not file or file.mimetype != "application/pdf":
            return func.HttpResponse(json.dumps({"error": "PDF inválido ou ausente."}), status_code=400, mimetype="application/json")
        
        blob_content = file.read()
        original_filename = file.filename
        
    except Exception as e:
        return func.HttpResponse(json.dumps({"error": f"Erro de leitura do formulário: {str(e)}"}), status_code=400, mimetype="application/json")

    try:
        if not blob_service_client:
            logging.critical("Cliente Blob Service (global) não inicializado!")
            return func.HttpResponse(json.dumps({"error": "Serviço indisponível."}), status_code=500, mimetype="application/json")

        output_container = "documentos-brutos"
        blob_metadata = {"user_id": user_id, "original_filename": original_filename}
        
        extension = os.path.splitext(original_filename)[1]
        safe_blob_name = f"{uuid.uuid4()}{extension}"

        blob_client = blob_service_client.get_blob_client(container=output_container, blob=safe_blob_name)
        blob_client.upload_blob(blob_content, metadata=blob_metadata)
        
        logging.info(f"Blob {safe_blob_name} salvo por user_id: {user_id}")
        
    except Exception as e:
        logging.error(f"Falha ao salvar blob: {e}", exc_info=True)
        return func.HttpResponse(json.dumps({"error": "Falha interna ao salvar o arquivo."}), status_code=500, mimetype="application/json")

    return func.HttpResponse(json.dumps({"success": True, "message": f"Arquivo '{original_filename}' enviado."}), status_code=200, mimetype="application/json")