import streamlit as st
import requests

# Pegamos a chave web (diferente do JSON de credenciais)
API_KEY = st.secrets["firebase"]["api_key"]

def init_session():
    if 'uid' not in st.session_state:
        st.session_state['uid'] = None

def _chamada_firebase(email, password, mode="login"):
    """Comunicação direta com a REST API do Firebase Identity Toolkit"""
    if mode == "login":
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    else:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
        
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        return {"error": {"message": str(e)}}

def login_screen():
    st.title("Acesso ao Sistema")
    
    aba_login, aba_cadastro = st.tabs(["Entrar", "Criar Conta"])
    
    # --- FLUXO DE LOGIN ---
    with aba_login:
        with st.form("login_form"):
            email = st.text_input("E-mail")
            senha = st.text_input("Senha", type="password")
            
            if st.form_submit_button("Entrar", type="primary"):
                if email and senha:
                    resultado = _chamada_firebase(email, senha, mode="login")
                    
                    if "localId" in resultado:
                        # Sucesso: Armazena o UID (o mesmo usado nos documentos do banco)
                        st.session_state['uid'] = resultado["localId"]
                        st.rerun()
                    else:
                        erro = resultado.get("error", {}).get("message", "Erro desconhecido")
                        st.error(f"Falha no login: {erro}")
                else:
                    st.warning("Preencha e-mail e senha.")

    # --- FLUXO DE CADASTRO ---
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
                        st.session_state['uid'] = resultado["localId"]
                        st.success("Conta criada com sucesso!")
                        st.rerun()
                    else:
                        erro = resultado.get("error", {}).get("message", "Erro desconhecido")
                        st.error(f"Falha ao criar conta: {erro}")

def logout():
    st.session_state['uid'] = None
    st.rerun()

def get_current_user():
    return st.session_state.get('uid')