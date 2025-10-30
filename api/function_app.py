import logging
import os
import hashlib
import time
import datetime # Para trabalhar com datas
from io import BytesIO
from dateutil.relativedelta import relativedelta # Para adicionar meses à data
import re 
import base64  # Para decodificar o token de autenticação do SWA
import uuid    # Para gerar nomes de arquivo únicos e seguros
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient

# NOVAS IMPORTAÇÕES para Document Intelligence
from azure.core.credentials import AzureKeyCredential as DocumentIntelligenceKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult

# --- Inicialização Global (Clientes Azure) ---
azure_credential = DefaultAzureCredential()
search_client = None
doc_intelligence_client = None
MODEL_ID_PARA_ANALISE = None
blob_service_client = None

try:
    # Cliente do AI Search (usando Managed Identity)
    search_service_name = os.environ['AZURE_SEARCH_SERVICE_NAME']
    search_index_name = os.environ['AZURE_SEARCH_INDEX_NAME']
    search_endpoint = f"https://{search_service_name}.search.windows.net"
    search_client = SearchClient(endpoint=search_endpoint,
                                 index_name=search_index_name,
                                 credential=azure_credential)
    logging.info(f"Cliente AI Search conectado via Identidade a '{search_service_name}'.")

    # Cliente do Document Intelligence (usando Chave)
    # (Usando os nomes de variáveis do seu código v7)
    doc_intel_endpoint = os.environ['DOCUMENTINTELLIGENCE_ENDPOINT']
    doc_intel_key = os.environ['DOCUMENTINTELLIGENCE_KEY']
    doc_intelligence_client = DocumentIntelligenceClient(
        endpoint=doc_intel_endpoint,
        credential=DocumentIntelligenceKeyCredential(doc_intel_key)
    )
    logging.info(f"Cliente Document Intelligence conectado ao endpoint.")
    
    # --- INÍCIO DA CORREÇÃO TÁTICA ---
    # Adicionar o Cliente do Blob Service (para o Upload HTTP)
    # Ele usa a string de conexão que já está nas Configurações do SWA
    
    connect_str = os.environ.get("AzureWebJobsStorage")
    if not connect_str:
        logging.error("Variável de ambiente AzureWebJobsStorage não definida.")
        raise ValueError("String de Conexão do Storage ausente.")
        
    from azure.storage.blob import BlobServiceClient
    blob_service_client = BlobServiceClient.from_connection_string(connect_str)
    logging.info("Cliente Blob Service (AzureWebJobsStorage) inicializado.")

    # --- CORREÇÃO (Fusão v7.1): Carregar o Model ID do ambiente ---
    MODEL_ID_PARA_ANALISE = os.environ.get("DOCUMENT_INTELLIGENCE_MODEL_ID")
    if not MODEL_ID_PARA_ANALISE:
        logging.error("Variável de ambiente DOCUMENT_INTELLIGENCE_MODEL_ID não definida.")
        raise ValueError("ID do Modelo de DI ausente.")
    logging.info(f"Modelo de DI a ser usado: {MODEL_ID_PARA_ANALISE}")


except KeyError as e:
    logging.error(f"ERRO CRÍTICO: Variável de ambiente não encontrada: {e}.")
except Exception as e:
    logging.error(f"Erro crítico na inicialização dos clientes Azure: {e}")
# -------------------------------------------------

app = func.FunctionApp()

def get_field_value(document, field_name):
    """
    Helper function tático (V7.5 - Corrigido para AttributeError 'value')
    O atributo '.value' SÓ existe se um valor for extraído.
    O atributo '.content' SEMPRE existe.
    
    Estratégia:
    1. Para 'date', TENTAMOS pegar '.value' (o obj datetime.date) de forma segura.
    2. Para TUDO MAIS, pegamos '.content' (a string).
    """
    field = document.fields.get(field_name)
    
    if not field:
        return None # O campo nem foi definido no modelo

    # --- CORREÇÃO V7.5 ---
    
    # Caso Especial: Data. Queremos o objeto datetime.date para a lógica de negócio.
    if field.type == "date":
        # Devemos verificar se o atributo 'value' existe E se não é None
        # antes de tentar acessá-lo.
        if hasattr(field, 'value') and field.value is not None:
            return field.value # Retorna o objeto datetime.date
        else:
            # Fallback se o campo de data foi encontrado mas estava vazio
            return field.content # Retorna o texto (ou None/vazio)

    # Para todos os outros tipos (string, number, integer, etc.),
    # o '.content' (a string bruta) é a fonte mais segura.
    # O erro provou que '.value' não é confiável para "string".
    return field.content

def get_user_id_from_swa(req: func.HttpRequest):
    """
    Extrai o user_id (user details) do cabeçalho de autenticação 
    seguro (x-ms-client-principal) injetado pelo Static Web App.
    """
    header = req.headers.get("x-ms-client-principal")
    if not header:
        return None  # Usuário não autenticado

    try:
        # O cabeçalho é B64-encoded JSON
        decoded_token = base64.b64decode(header).decode('utf-8')
        token_json = json.loads(decoded_token)
        
        # 'userDetails' é tipicamente o e-mail ou nome de usuário
        user_details = token_json.get("userDetails") 
        
        if not user_details:
            logging.warning("Autenticado, mas 'userDetails' não encontrado no token SWA.")
            return token_json.get("userId") # Fallback para o ID interno
            
        return user_details
    except Exception as e:
        logging.error(f"Erro catastrófico ao decodificar token SWA: {str(e)}")
        return None

@app.blob_trigger(
    arg_name="myblob",
    path="documentos-brutos/{name}",
    connection="AzureWebJobsStorage"
)
def ProcessMedicalReport(myblob: func.InputStream):
    """
    Função V7.2 (Fundida e Corrigida): Disparada por Blob Trigger.
    1. Calcula Hash.
    2. Analisa documento com Document Intelligence (modelo carregado do env).
    3. Extrai campos estruturados (Nome, CPF, Médico, Datas, etc.).
    4. Valida Data e Médico (Mock).
    5. Salva resultado completo no AI Search (Índice V7).
    """
    if not search_client or not doc_intelligence_client or not MODEL_ID_PARA_ANALISE:
        logging.error("Clientes Azure ou Model ID não inicializados. Verifique logs e variáveis de ambiente.")
        raise Exception("Clientes Azure ou Model ID não inicializados.")

    blob_name_full = myblob.name
    blob_name_short = blob_name_full.split('/')[-1]
    logging.info(f"Processando blob: {blob_name_full} (Tamanho: {myblob.length} bytes)")

    try:
        # --- CORREÇÃO (Bug de Dupla Leitura): Ler o blob APENAS UMA VEZ ---
        file_bytes = myblob.read()
        
        if not file_bytes:
            logging.error(f"O blob {blob_name_full} está vazio. Abortando análise.")
            return 

        logging.info(f"Conteúdo do blob lido (Tamanho: {len(file_bytes)} bytes).")
        
        # 1. Calcular Hash
        hasher = hashlib.sha256()
        hasher.update(file_bytes)
        document_hash = hasher.hexdigest()
        logging.info(f"Hash calculado: {document_hash[:10]}...")

        # (FUTURO: Obter user_id dos metadados do blob)
        user_id_from_metadata = "mock_user_id_123" # Substituir pela leitura dos metadados

        # 2. Analisar Documento com Document Intelligence (MODELO NEURAL)
        logging.info(f"Iniciando análise com Document Intelligence (modelo '{MODEL_ID_PARA_ANALISE}')...")

        # --- CORREÇÃO TÁTICA (Fusão v7.1) ---
        # Usar a variável MODEL_ID_PARA_ANALISE e passar os 'file_bytes' lidos
        
        poller = doc_intelligence_client.begin_analyze_document(
            model_id=MODEL_ID_PARA_ANALISE,
            body=file_bytes  # <--- Correção Crítica
        )

        result: AnalyzeResult = poller.result()
        logging.info("Análise do Document Intelligence concluída.")
        
        # 3. Extrair Dados (Parsing do Modelo Neural)
        logging.info("Iniciando extração de dados estruturados do modelo neural...")

        # Dicionário para armazenar dados extraídos
        extracted_data = {}
        raw_text_content = result.content # Texto bruto completo
        
        if result.documents:
            logging.info(f"Documentos encontrados no resultado: {len(result.documents)}")
            document = result.documents[0] 
            
            # Mapear campos do modelo
            extracted_data = {
                "nome_paciente": get_field_value(document, "NomePaciente"),
                "rg_paciente": get_field_value(document, "RGpaciente"),
                "cpf_paciente": get_field_value(document, "CPFpaciente"),
                "nome_medico": get_field_value(document, "NomeMedico"),
                "id_medico": get_field_value(document, "IDMedico"),
                "data_laudo": get_field_value(document, "DatadoLaudo"), # Retorna obj datetime.date
                "tempo_afastamento": get_field_value(document, "TempoAfastamento"),
                "definicao_laudo": get_field_value(document, "DefinicaoLaudo"),
                "nome_entidade_emissora": get_field_value(document, "NomeEntidadeEmissora"),
                "cnpj_entidade_emissora": get_field_value(document, "CNPJEntidadeEmissora")
            }
            logging.info(f"Dados extraídos (brutos): {extracted_data}")
        else:
            logging.warning("Nenhum 'document' encontrado no resultado do modelo personalizado. A extração falhou.")
        
        # Atribuir os valores encontrados (ou None)
        nome_paciente = extracted_data.get("nome_paciente")
        rg_paciente = extracted_data.get("rg_paciente")
        cpf_paciente = extracted_data.get("cpf_paciente")
        nome_medico = extracted_data.get("nome_medico")
        id_medico = extracted_data.get("id_medico")
        data_laudo_obj = extracted_data.get("data_laudo") # Este é um objeto datetime.date
        tempo_afastamento = extracted_data.get("tempo_afastamento")
        definicao_laudo = extracted_data.get("definicao_laudo")
        nome_entidade = extracted_data.get("nome_entidade_emissora")
        cnpj_entidade = extracted_data.get("cnpj_entidade_emissora")

        # 4. Validações (Lógica de Negócio V7 Preservada)
        status_validade = "Indeterminado"
        status_fraude = "Não Verificado"
        fraude_detalhe = ""
        data_validade_iso = None
        data_laudo_iso_str = None # Para salvar no índice

        # 4.1 Validação de Data (Usa 'data_laudo_obj')
        if data_laudo_obj:
            try:
                # Converter datetime.date para datetime.datetime UTC para cálculo
                data_laudo_dt = datetime.datetime.combine(data_laudo_obj, datetime.time.min, tzinfo=datetime.timezone.utc)
                data_laudo_iso_str = data_laudo_dt.isoformat().replace('+00:00', 'Z') # Formato para DateTimeOffset

                data_validade_dt = data_laudo_dt + relativedelta(months=+2)
                data_validade_iso = data_validade_dt.isoformat().replace('+00:00', 'Z')
                hoje = datetime.datetime.now(datetime.timezone.utc)

                if hoje <= data_validade_dt:
                    status_validade = "Válido"
                else:
                    status_validade = "Expirado"
                    status_fraude = "Rejeitado: Validade Expirada"
                    fraude_detalhe = f"Laudo emitido em {data_laudo_dt.strftime('%d/%m/%Y')} expirou em {data_validade_dt.strftime('%d/%m/%Y')}."
            except Exception as e:
                logging.error(f"Erro ao validar data_laudo_obj '{data_laudo_obj}': {e}")
                status_validade = "Erro na Validação de Data"
        else:
            status_validade = "Data de Laudo Não Encontrada"

        # 4.2 Validação Médico (Usa 'id_medico' e 'nome_medico')
        medico_autorizado = False
        if nome_medico and id_medico:
            # --- MOCK DB CHECK ---
            medicos_db_mock = { "12345": "Dr. Joao Silva", "67890": "Dra. Maria Souza" }
            # (Limpar o IDMedico de possíveis formatações (ex: "CRM 12345 SP" -> "12345") - omitido por simplicidade)
            if id_medico in medicos_db_mock and medicos_db_mock[id_medico].lower() in nome_medico.lower():
                medico_autorizado = True
            # --- FIM MOCK ---
            if not medico_autorizado and status_fraude == "Não Verificado":
                status_fraude = "Rejeitado: Médico Não Autorizado"
                fraude_detalhe = f"Médico {nome_medico} (ID: {id_medico}) não encontrado ou não autorizado."
        # ----------------------------------------------------------

        # 5. Salvar no AI Search (Índice V7 - Lógica V7 Preservada)
        document_to_index = {
            "id": document_hash,
            "document_hash": document_hash,
            "filename": blob_name_short,
            "user_id": user_id_from_metadata,
            "upload_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
            "model_id": MODEL_ID_PARA_ANALISE, # <--- CORREÇÃO: Usando a variável
            "raw_text": raw_text_content,
            
            # Campos do Modelo Neural
            "nome_paciente": nome_paciente,
            "rg_paciente": rg_paciente,
            "cpf_paciente": cpf_paciente,
            "nome_medico": nome_medico,
            "id_medico": id_medico,
            "data_laudo": data_laudo_iso_str, # Salva como DateTimeOffset
            "tempo_afastamento": tempo_afastamento,
            "definicao_laudo": definicao_laudo,
            "nome_entidade_emissora": nome_entidade,
            "cnpj_entidade_emissora": cnpj_entidade,

            # Campos de Status e Validação
            "status_processamento": "Processado_V7_Neural",
            "status_validade": status_validade,
            "status_fraude": status_fraude,
            "fraude_detalhe": fraude_detalhe
        }
        
        # Limpar chaves com valores None para evitar erros no AI Search
        final_document = {k: v for k, v in document_to_index.items() if v is not None}
        # Garantir que o 'id' (que não pode ser None) esteja presente
        final_document['id'] = document_hash
        # -------------------------------------------------------------

        logging.info(f"Enviando documento {document_hash} para o índice AI Search V7...")
        result = search_client.upload_documents(documents=[final_document])

        if result[0].succeeded:
            logging.info(f"Documento {document_hash} indexado com sucesso no AI Search.")
        else:
            logging.error(f"Falha ao indexar {document_hash} no AI Search. Razão: {result[0].error_message}")
            raise Exception(f"Falha ao indexar no AI Search: {result[0].error_message}")

    except Exception as e:
        logging.error(f"Erro catastrófico ao processar {blob_name_full}: {e}", exc_info=True)
        # (Opcional) Salvar um registro de falha
        raise e

@app.route(route="upload", auth_level=func.AuthLevel.ANONYMOUS)
def UploadLaudoHTTP(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP Trigger (A Ponte) - Missão:
    1. Recebe o upload do frontend React.
    2. Valida a autenticação do usuário via SWA.
    3. Valida o tipo de arquivo (PDF).
    4. Salva no 'documentos-brutos' com metadados ('user_id').
    5. O Blob Trigger 'ProcessMedicalReport' cuidará do resto.
    """
    logging.info("Ponte HTTP 'UploadLaudoHTTP' acionada.")

    # --- FASE 1: AUTENTICAÇÃO E AUTORIZAÇÃO ---
    user_id = get_user_id_from_swa(req)
    if not user_id:
        logging.warning("UploadLaudoHTTP: Tentativa de acesso não autenticado (401).")
        return func.HttpResponse(
            json.dumps({"error": "Não autorizado. Faça o login no portal."}),
            status_code=401,
            mimetype="application/json"
        )
    logging.info(f"Requisição autenticada. Usuário: {user_id}")

    # --- FASE 2: VALIDAÇÃO DO ARQUIVO ---
    try:
        # O frontend deve enviar o arquivo no campo 'file'
        file = req.files.get("file") 
        
        if not file:
            logging.warning(f"Usuário {user_id} enviou requisição sem 'file'.")
            return func.HttpResponse(
                json.dumps({"error": "Nenhum arquivo 'file' encontrado no formulário."}),
                status_code=400,
                mimetype="application/json"
            )

        # (RF-002) Validar tipo
        if file.mimetype != "application/pdf":
            logging.warning(f"Usuário {user_id} tentou enviar tipo inválido: {file.mimetype}")
            return func.HttpResponse(
                json.dumps({"error": "Tipo de arquivo inválido. Apenas PDF é permitido."}),
                status_code=400,
                mimetype="application/json"
            )
        
        blob_content = file.read()
        original_filename = file.filename
        logging.info(f"Arquivo recebido de {user_id}: {original_filename}")

    except Exception as e:
        logging.error(f"Erro ao ler o arquivo da requisição: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"error": "Formato de requisição inválido (esperado multipart/form-data)."}),
            status_code=400,
            mimetype="application/json"
        )

    # --- FASE 3: SALVAR NO STORAGE (A MISSÃO CRÍTICA) ---
    try:
        # Reutilizar o cliente global já inicializado
        if not blob_service_client:
            logging.critical("Cliente Blob Service (global) não inicializado!")
            raise Exception("Blob Service Client indisponível.")

        output_container = "documentos-brutos"
        
        # Metadados que nosso Blob Trigger usará
        blob_metadata = {
            "user_id": user_id,
            "original_filename": original_filename
        }
        
        # Gerar nome seguro para evitar colisões
        extension = os.path.splitext(original_filename)[1]
        safe_blob_name = f"{uuid.uuid4()}{extension}"

        blob_client = blob_service_client.get_blob_client(
            container=output_container,
            blob=safe_blob_name
        )
        
        # Upload com os metadados
        blob_client.upload_blob(
            blob_content,
            blob_type="BlockBlob",
            overwrite=False,
            metadata=blob_metadata # <-- SUCESSO TÁTICO
        )
        
        logging.info(f"Blob {safe_blob_name} salvo em 'documentos-brutos' com metadados para user_id: {user_id}")

    except Exception as e:
        logging.error(f"Falha catastrófica ao salvar blob: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"error": "Falha interna do servidor ao salvar o arquivo."}),
            status_code=500,
            mimetype="application/json"
        )

    # --- FASE 4: SUCESSO ---
    return func.HttpResponse(
        json.dumps({
            "success": True, 
            "message": f"Arquivo '{original_filename}' enviado com sucesso.",
            "blob_name": safe_blob_name
        }),
        status_code=200,
        mimetype="application/json"
    )