import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import streamlit as st

@st.cache_resource
def get_db():
    if not firebase_admin._apps:
        key_dict = dict(st.secrets["firebase"])
        cred = credentials.Certificate(key_dict)
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = get_db()

def carregar_colecao(user_id, nome_colecao, colunas_padrao):
    # CRÍTICA: No futuro, adicione limites (limit) ou paginação aqui!
    docs = db.collection("usuarios").document(user_id).collection(nome_colecao).stream()
    dados = [doc.to_dict() for doc in docs]
    if dados:
        return pd.DataFrame(dados)
    return pd.DataFrame(columns=colunas_padrao)

def salvar_lote(user_id, nome_colecao, lista_dicts):
    colecao_ref = db.collection("usuarios").document(user_id).collection(nome_colecao)
    batch = db.batch()
    for item in lista_dicts:
        novo_doc_ref = colecao_ref.document()
        batch.set(novo_doc_ref, item)
    batch.commit()

def deletar_exercicio(user_id, nome_exercicio):
    docs = db.collection("usuarios").document(user_id).collection("config_treinos").where("Exercicio", "==", nome_exercicio).stream()
    for doc in docs:
        doc.reference.delete()
        
def salvar_documento(user_id, nome_colecao, dados):
    """Salva um único documento no Firebase."""
    db.collection("usuarios").document(user_id).collection(nome_colecao).add(dados)