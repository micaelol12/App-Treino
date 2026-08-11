import streamlit as st
import plotly.graph_objects as go
from datetime import date
from database import salvar_documento, carregar_colecao
from utils import processar_dados_peso

def render_tab_peso(user_id):
    c_form, c_chart = st.columns([1, 2])
    
    with c_form:
        with st.form("form_peso"):
            data_peso = st.date_input("Data", date.today())
            peso_atual = st.number_input("Peso (kg)", min_value=30.0, step=0.1, value=75.0)
            
            if st.form_submit_button("Gravar Peso"):
                salvar_documento(user_id, "historico_pesos", {
                    "Data": data_peso.strftime("%Y-%m-%d"),
                    "Peso": peso_atual
                })
                st.success("Peso gravado com sucesso!")
                st.rerun()

    with c_chart:
        df_peso = carregar_colecao(user_id, "historico_pesos", ["Data", "Peso"])
        
        if not df_peso.empty:
            df_peso = processar_dados_peso(df_peso)
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=df_peso["Data"], y=df_peso["Peso"], mode='markers', name='Diário'))
            fig.add_trace(go.Scatter(x=df_peso["Data"], y=df_peso["Média 7 Dias"], mode='lines', name='Tendência'))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Nenhum registro de peso encontrado.")