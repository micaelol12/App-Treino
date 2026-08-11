import streamlit as st

def init_session():
    if 'uid' not in st.session_state:
        st.session_state['uid'] = None

def login_screen():
    st.title("Acesso ao Sistema")
    with st.form("login_form"):
        email = st.text_input("E-mail")
        senha = st.text_input("Senha", type="password")
        if st.form_submit_button("Entrar"):
            if email and senha:
                st.session_state['uid'] = "user_12345_alpha"
                st.rerun()

def logout():
    st.session_state['uid'] = None
    st.rerun()

def get_current_user():
    return st.session_state.get('uid')