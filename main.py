import streamlit as st
import auth


from views.tab_treino_dinamico import render_tab_treino_dinamico
from views.tab_registro import render_tab_registro
from views.tab_analise import render_tab_analise
from views.tab_peso import render_tab_peso
from views.tab_config import render_tab_config

st.set_page_config(page_title="Sistema de Telemetria", layout="wide")

auth.init_session()
user_id = auth.get_current_user()

if user_id is None:
    auth.login_screen()
    st.stop()

st.sidebar.button("Sair / Logout", on_click=auth.logout)
st.title("Sistema de Telemetria de Treino")

tab_din, tab_reg, tab_ana, tab_pes, tab_cfg = st.tabs([
    "🏋️‍♂️ Treino Ativo","📝 Registro", "📈 Evolução", "⚖️ Peso", "⚙️ Configurações"
])

with tab_din:
    render_tab_treino_dinamico(user_id)
    
with tab_reg:
    render_tab_registro(user_id)

with tab_ana:
    render_tab_analise(user_id)

with tab_pes:
    render_tab_peso(user_id)

with tab_cfg:
    render_tab_config(user_id)