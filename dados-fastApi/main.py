# main.py
import os
from fastapi import FastAPI
from pymongo import MongoClient
# from dotenv import load_dotenv # Apenas para desenvolvimento local!

# load_dotenv() # Apenas para desenvolvimento local! No Render, as variáveis são injetadas

app = FastAPI()

# Obtenha a URI de conexão e o nome do BD das variáveis de ambiente
MONGO_URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("DB_NAME", "odontolegal") # Default para 'odontolegal'

if not MONGO_URI:
    raise ValueError("MONGODB_URI não está configurada nas variáveis de ambiente.")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Exemplo de endpoint para buscar casos
@app.get("/casos")
async def get_casos():
    casos = list(db.casos.find({}, {"_id": 0}).limit(10)) # Retorna os primeiros 10 casos, sem o _id
    return {"data": casos}

# Exemplo de endpoint para buscar vítimas
@app.get("/vitimas")
async def get_vitimas():
    vitimas = list(db.vitimas.find({}, {"_id": 0}).limit(10)) # Retorna as primeiras 10 vítimas, sem o _id
    return {"data": vitimas}

# Endpoint de teste
@app.get("/")
async def read_root():
    return {"message": "API FastAPI rodando no Render!"}

# Lembre-se de fechar a conexão se seu aplicativo for simples e fechar com o servidor.
# Para apps maiores, considere um gerenciamento de ciclo de vida mais robusto.
@app.on_event("shutdown")
def shutdown_db_client():
    client.close()
