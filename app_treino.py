import streamlit as st
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import date
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="Sistema de Telemetria", layout="wide")

# ==========================================
# CONEXÃO COM O FIREBASE
# ==========================================
# Garante que o app do Firebase seja inicializado apenas uma vez
if not firebase_admin._apps:
    key_dict = dict(st.secrets["firebase"])
    
    cred = credentials.Certificate(key_dict)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ==========================================
# SISTEMA DE SESSÃO E USUÁRIO (MOCK AUTH)
# ==========================================
# Em produção, você usaria o Pyrebase4 ou a REST API do Firebase 
# para autenticar email/senha e obter este UID.
if 'uid' not in st.session_state:
    st.session_state['uid'] = None

# Tela de Login Simples
if st.session_state['uid'] is None:
    st.title("Acesso ao Sistema")
    with st.form("login_form"):
        email = st.text_input("E-mail")
        senha = st.text_input("Senha", type="password")
        if st.form_submit_button("Entrar"):
            if email and senha:
                # Simulando um login bem sucedido gerando um ID fixo para teste
                st.session_state['uid'] = "user_12345_alpha"
                st.rerun()
    st.stop() # Interrompe a execução do resto do script se não estiver logado

USER_ID = st.session_state['uid']

# ==========================================
# FUNÇÕES DE I/O (FIREBASE FIRESTORE)
# ==========================================

def carregar_colecao(nome_colecao, colunas_padrao):
    """Lê uma subcoleção do usuário atual e a converte para DataFrame Pandas."""
    docs = db.collection("usuarios").document(USER_ID).collection(nome_colecao).stream()
    dados = [doc.to_dict() for doc in docs]
    
    if dados:
        return pd.DataFrame(dados)
    return pd.DataFrame(columns=colunas_padrao)

def salvar_lote(nome_colecao, lista_dicts):
    """Salva múltiplos documentos no Firebase utilizando Batch Operations para performance."""
    colecao_ref = db.collection("usuarios").document(USER_ID).collection(nome_colecao)
    batch = db.batch()
    
    for item in lista_dicts:
        novo_doc_ref = colecao_ref.document() # Gera um ID único aleatório
        batch.set(novo_doc_ref, item)
        
    batch.commit()

# Wrappers
def load_data(): return carregar_colecao("historico_treinos", ["Data", "Treino", "Exercício", "Série", "Carga", "Reps", "RPE", "Obs"])
def load_peso(): return carregar_colecao("historico_pesos", ["Data", "Peso"])
def load_config(): return carregar_colecao("config_treinos", ["Divisao", "Exercicio", "Series_Padrao"])

# ==========================================
# PROCESSAMENTO DA ESTRUTURA DINÂMICA
# ==========================================
df_config = load_config()
TREINOS_DINAMICOS = {}

if not df_config.empty:
    for _, row in df_config.iterrows():
        divisao = str(row.get("Divisao", "")).strip()
        exercicio = str(row.get("Exercicio", "")).strip()
        try:
            series = int(float(row.get("Series_Padrao", 1)))
        except ValueError:
            series = 1 
            
        if divisao not in TREINOS_DINAMICOS:
            TREINOS_DINAMICOS[divisao] = {}
        TREINOS_DINAMICOS[divisao][exercicio] = series

# ==========================================
# INTERFACE DO APLICATIVO
# ==========================================
st.sidebar.button("Sair / Logout", on_click=lambda: st.session_state.update({'uid': None}))
st.title("Sistema de Telemetria de Treino")

tab_registro, tab_analise, tab_peso, tab_config = st.tabs([
    "📝 Registro", "📈 Evolução", "⚖️ Peso", "⚙️ Configurações"
])

# --- ABA 4: CONFIGURAÇÕES ---
with tab_config:
    st.subheader("Gerenciar Estrutura de Treinos")
    col_form_cfg, col_tabela_cfg = st.columns([1, 2])
    
    with col_form_cfg:
        with st.form("form_novo_exercicio"):
            nova_divisao = st.text_input("Divisão (ex: Pull)")
            novo_exercicio = st.text_input("Exercício")
            novas_series = st.number_input("Séries Padrão", min_value=1, max_value=10, value=3)
            
            if st.form_submit_button("Adicionar"):
                if nova_divisao and novo_exercicio:
                    db.collection("usuarios").document(USER_ID).collection("config_treinos").add({
                        "Divisao": nova_divisao,
                        "Exercicio": novo_exercicio,
                        "Series_Padrao": novas_series
                    })
                    st.success("Adicionado!")
                    st.rerun()
    
    with col_tabela_cfg:
        if not df_config.empty:
            st.dataframe(df_config, use_container_width=True, hide_index=True)
            
            # Deleção no Firebase exige buscar o ID do documento
            st.divider()
            ex_remover = st.selectbox("Selecione para excluir", df_config["Exercicio"].tolist())
            if st.button("Excluir Exercício Selecionado", type="primary"):
                docs = db.collection("usuarios").document(USER_ID).collection("config_treinos").where("Exercicio", "==", ex_remover).stream()
                for doc in docs:
                    doc.reference.delete()
                st.rerun()

# --- ABA 1: REGISTRO DE TREINO ---
with tab_registro:
    if not TREINOS_DINAMICOS:
        st.warning("⚠️ Cadastre sua estrutura de treinos na aba '⚙️ Configurações'.")
    else:
        col1, col2 = st.columns(2)
        data_treino = col1.date_input("Data do Treino", date.today())
        treino_selecionado = col2.selectbox("Selecione a Divisão", list(TREINOS_DINAMICOS.keys()))

        st.divider()
        exercicios_da_divisao = TREINOS_DINAMICOS[treino_selecionado]
        registros_sessao = []

        with st.form("form_treino"):
            for exercicio, num_series in exercicios_da_divisao.items():
                st.markdown(f"**{exercicio}**")
                for serie in range(1, num_series + 1):
                    c1, c2, c3, c4 = st.columns([1, 1, 1, 2])
                    carga = c1.number_input("Carga (kg)", min_value=0.0, step=1.0, key=f"{exercicio}_carga_{serie}")
                    reps = c2.number_input("Reps", min_value=0, step=1, key=f"{exercicio}_reps_{serie}")
                    rpe = c3.number_input("RPE", min_value=1, max_value=10, value=8, key=f"{exercicio}_rpe_{serie}")
                    obs = c4.text_input("Obs", key=f"{exercicio}_obs_{serie}")
                    
                    if reps > 0:
                        registros_sessao.append({
                            "Data": data_treino.strftime("%Y-%m-%d"),
                            "Treino": treino_selecionado,
                            "Exercício": exercicio,
                            "Série": serie,
                            "Carga": carga,
                            "Reps": reps,
                            "RPE": rpe,
                            "Obs": obs
                        })
                st.markdown("---")
                
            if st.form_submit_button("Salvar Treino"):
                if registros_sessao:
                    salvar_lote("historico_treinos", registros_sessao)
                    st.success("Treino salvo no Firebase!")
                    st.rerun()

# --- ABA 2: ANÁLISE DE EVOLUÇÃO ---
with tab_analise:
    df_analise = load_data()
    if not df_analise.empty:
        # Conversão forçada de tipos (Gargalo analítico do NoSQL)
        df_analise["Data"] = pd.to_datetime(df_analise["Data"])
        df_analise["Carga"] = pd.to_numeric(df_analise["Carga"])
        df_analise["Reps"] = pd.to_numeric(df_analise["Reps"])
        
        df_analise["Volume Load (kg)"] = df_analise["Carga"] * df_analise["Reps"]
        df_analise["1RM Estimada (kg)"] = df_analise["Carga"] * (1 + (df_analise["Reps"] / 30))

        ex_selecionado = st.selectbox("Filtrar Exercício", df_analise["Exercício"].unique())
        df_filtrado = df_analise[df_analise["Exercício"] == ex_selecionado]

        if not df_filtrado.empty:
            df_grouped = df_filtrado.groupby("Data").agg(
                Max_Carga=("Carga", "max"), Max_1RM=("1RM Estimada (kg)", "max"), Volume_Total=("Volume Load (kg)", "sum")
            ).reset_index()

            st.plotly_chart(px.line(df_grouped, x="Data", y=["Max_1RM", "Max_Carga"], markers=True, title="Força Máxima Estimada"), use_container_width=True)
            st.plotly_chart(px.bar(df_grouped, x="Data", y="Volume_Total", title="Volume Total da Sessão"), use_container_width=True)

# --- ABA 3: CONTROLE DE PESO ---
with tab_peso:
    c_form, c_chart = st.columns([1, 2])
    with c_form:
        with st.form("form_peso"):
            data_peso = st.date_input("Data", date.today())
            peso_atual = st.number_input("Peso (kg)", min_value=30.0, step=0.1, value=75.0)
            if st.form_submit_button("Gravar Peso"):
                db.collection("usuarios").document(USER_ID).collection("historico_pesos").add({
                    "Data": data_peso.strftime("%Y-%m-%d"),
                    "Peso": peso_atual
                })
                st.rerun()

    with c_chart:
        df_peso = load_peso()
        if not df_peso.empty:
            df_peso["Data"] = pd.to_datetime(df_peso["Data"])
            df_peso["Peso"] = pd.to_numeric(df_peso["Peso"])
            df_peso = df_peso.sort_values(by="Data").drop_duplicates(subset=["Data"], keep="last")
            df_peso["Média 7 Dias"] = df_peso["Peso"].rolling(window=7, min_periods=1).mean()
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=df_peso["Data"], y=df_peso["Peso"], mode='markers', name='Diário'))
            fig.add_trace(go.Scatter(x=df_peso["Data"], y=df_peso["Média 7 Dias"], mode='lines', name='Tendência'))
            st.plotly_chart(fig, use_container_width=True)