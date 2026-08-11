import streamlit as st
import plotly.express as px
from database import carregar_colecao
from utils import processar_dados_analise

def render_tab_analise(user_id):
    df_analise = carregar_colecao(user_id, "historico_treinos", ["Data", "Treino", "Exercício", "Série", "Carga", "Reps", "RPE", "Obs"])
    
    if df_analise.empty:
        st.info("Nenhum dado de treino registrado ainda.")
        return

    df_analise = processar_dados_analise(df_analise)

    ex_selecionado = st.selectbox("Filtrar Exercício", df_analise["Exercício"].unique())
    df_filtrado = df_analise[df_analise["Exercício"] == ex_selecionado]

    if not df_filtrado.empty:
        df_grouped = df_filtrado.groupby("Data").agg(
            Max_Carga=("Carga", "max"), 
            Max_1RM=("1RM Estimada (kg)", "max"), 
            Volume_Total=("Volume Load (kg)", "sum")
        ).reset_index()

        st.plotly_chart(px.line(df_grouped, x="Data", y=["Max_1RM", "Max_Carga"], markers=True, title="Força Máxima Estimada"), use_container_width=True)
        st.plotly_chart(px.bar(df_grouped, x="Data", y="Volume_Total", title="Volume Total da Sessão"), use_container_width=True)