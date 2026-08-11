import streamlit as st
import requests
import extra_streamlit_components as stx
import time

API_KEY = st.secrets["firebase"]["api_key"]

# Instancia o gerenciador de cookies. O cache evita que ele seja recriado a cada interação.
@st.cache_resource()
def get_cookie_manager():
    return stx.CookieManager(key="cookie_manager")

cookie_manager = get_cookie_manager()

def init_session():
    """Restaura a sessão do Streamlit usando o Cookie do navegador (se existir)"""
    if 'uid' not in st.session_state:
        st.session_state['uid'] = None

    # Tenta ler o cookie salvo
    cookie_uid = cookie_manager.get(cookie="auth_uid")
    
    # Se o cookie existir no navegador, mas a memória do Streamlit estiver vazia (F5), restaura.
    if cookie_uid is not None and st.session_state['uid'] is None:
        st.session_state['uid'] = cookie_uid

def _chamada_firebase(email, password, mode="login"):
    if mode == "login":
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    else:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
        
    payload = {"email": email, "password": password, "returnSecureToken": True}
    
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        return {"error": {"message": str(e)}}

def login_screen():
    st.title("Acesso ao Sistema")
    aba_login, aba_cadastro = st.tabs(["Entrar", "Criar Conta"])
    
    with aba_login:
        with st.form("login_form"):
            email = st.text_input("E-mail")
            senha = st.text_input("Senha", type="password")
            
            if st.form_submit_button("Entrar", type="primary"):
                if email and senha:
                    resultado = _chamada_firebase(email, senha, mode="login")
                    
                    if "localId" in resultado:
                        uid = resultado["localId"]
                        st.session_state['uid'] = uid
                        # Grava o cookie no navegador (duração de 30 dias)
                        cookie_manager.set("auth_uid", uid, max_age=30*24*60*60)
                        
                        # Pausa de meio segundo crucial: o Streamlit precisa de um tempo 
                        # para o JavaScript injetar o cookie no navegador antes do rerun.
                        time.sleep(0.5) 
                        st.rerun()
                    else:
                        st.error(f"Falha no login: {resultado.get('error', {}).get('message', 'Erro desconhecido')}")
                else:
                    st.warning("Preencha e-mail e senha.")

    with aba_cadastro:
        with st.form("signup_form"):
            email_cad = st.text_input("E-mail")
            senha_cad = st.text_input("Senha", type="password")
            senha_conf = st.text_input("Confirme a Senha", type="password")
            
            if st.form_submit_button("Cadastrar"):
                if not email_cad or not senha_cad:
                    st.warning("Preencha todos os campos.")
                elif senha_cad != senha_conf:
                    st.error("As senhas não coincidem.")
                elif len(senha_cad) < 6:
                    st.error("O Firebase exige senhas com no mínimo 6 caracteres.")
                else:
                    resultado = _chamada_firebase(email_cad, senha_cad, mode="signup")
                    
                    if "localId" in resultado:
                        uid = resultado["localId"]
                        st.session_state['uid'] = uid
                        cookie_manager.set("auth_uid", uid, max_age=30*24*60*60)
                        time.sleep(0.5)
                        st.success("Conta criada com sucesso!")
                        st.rerun()
                    else:
                        st.error(f"Falha ao criar conta: {resultado.get('error', {}).get('message', 'Erro desconhecido')}")

def logout():
    """Remove a sessão e destrói o cookie"""
    st.session_state['uid'] = None
    cookie_manager.delete("auth_uid")
    # Sem st.rerun() aqui, pois o on_click do botão já faz isso automaticamente.

def get_current_user():
    return st.session_state.get('uid')