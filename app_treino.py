import streamlit as st
import pandas as pd
from streamlit_gsheets import GSheetsConnection
from datetime import date
import plotly.express as px

# Configuração da página deve ser a primeira chamada Streamlit
st.set_page_config(page_title="Controle de Carga de Treino", layout="wide")

conn = st.connection("gsheets", type=GSheetsConnection)

TREINOS = {
    "Pull": {
        "Remada Articulada Máquina": 2, "Pulley Triângulo": 2, "Serrote": 2, 
        "Pulley Frente Aberto": 2, "Meio Terra": 2, "Rosca Scott": 3
    },
    "Push": {
        "Supino Inclinado Halter": 2, "Supino Reto Máquina": 2, "Voador": 2, 
        "Elevação Frontal/Desenv": 2, "Elevação Lateral": 2, "Tríceps Corda": 3
    },
    "Legs": {
        "Mesa Flexora": 2, "Agachamento (Padrão)": 2, "Cadeira Extensora": 2, 
        "Elevação Pélvica": 2, "Cadeira Adutora": 2
    },
    "Upper": {
        "Supino Inclinado Máquina": 2, "Crucifixo": 2, "T-Bar": 2, 
        "Pull Down": 2, "Elevação Lateral": 2, "Rosca Direta": 3, "Tríceps Francês": 3
    },
    "Lower": {
        "Cadeira Flexora": 2, "Pêndulo": 2, "Leg 45": 2, 
        "Stiff": 2, "Abdutora": 2
    }
}

def load_data():
    try:
        df = conn.read(worksheet="Historico", ttl=0)
        df = df.dropna(how="all")
        return df
    except Exception as e:
        st.error(f"Erro ao carregar dados: {e}")
        return pd.DataFrame(columns=["Data", "Treino", "Exercício", "Série", "Carga (kg)", "Reps", "RPE", "Obs"])

def save_data(new_data):
    df = load_data()
    updated_df = pd.concat([df, pd.DataFrame(new_data)], ignore_index=True)
    conn.update(worksheet="Historico", data=updated_df)

st.title("Controle de Carga e Evolução")

# Criação das abas estruturais
tab_registro, tab_analise = st.tabs(["📝 Registro de Treino", "📈 Análise de Evolução"])

# ==========================================
# ABA 1: REGISTRO DE TREINO
# ==========================================
with tab_registro:
    col1, col2 = st.columns(2)
    with col1:
        data_treino = st.date_input("Data do Treino", date.today())
    with col2:
        treino_selecionado = st.selectbox("Selecione a Divisão", list(TREINOS.keys()))

    st.divider()
    st.subheader(f"Exercícios - {treino_selecionado}")

    exercicios = TREINOS[treino_selecionado]
    registros_sessao = []

    with st.form("form_treino"):
        for exercicio, num_series in exercicios.items():
            st.markdown(f"**{exercicio}**")
            
            for serie in range(1, num_series + 1):
                c1, c2, c3, c4 = st.columns([1, 1, 1, 2])
                with c1:
                    carga = st.number_input(f"Carga (kg)", min_value=0.0, step=1.0, key=f"{exercicio}_carga_{serie}")
                with c2:
                    reps = st.number_input(f"Reps", min_value=0, step=1, key=f"{exercicio}_reps_{serie}")
                with c3:
                    rpe = st.number_input(f"RPE (1-10)", min_value=1, max_value=10, value=8, step=1, key=f"{exercicio}_rpe_{serie}")
                with c4:
                    obs = st.text_input(f"Obs (Opcional)", key=f"{exercicio}_obs_{serie}")
                
                if reps > 0:
                    registros_sessao.append({
                        "Data": data_treino.strftime("%Y-%m-%d"), # Padroniza string ISO
                        "Treino": treino_selecionado,
                        "Exercício": exercicio,
                        "Série": serie,
                        "Carga (kg)": carga,
                        "Reps": reps,
                        "RPE": rpe,
                        "Obs": obs
                    })
            st.markdown("---")
            
        submitted = st.form_submit_button("Salvar Treino")
        if submitted:
            if registros_sessao:
                save_data(registros_sessao)
                st.success("Treino registrado com sucesso!")
                st.rerun()
            else:
                st.warning("Preencha ao menos uma série válida (Reps > 0) antes de salvar.")

    st.divider()
    with st.expander("Ver Histórico Bruto"):
        historico_df = load_data()
        st.dataframe(historico_df, use_container_width=True)

# ==========================================
# ABA 2: ANÁLISE DE EVOLUÇÃO
# ==========================================
with tab_analise:
    st.subheader("Filtros de Análise")
    df_analise = load_data()
    
    if df_analise.empty:
        st.info("Nenhum dado registrado para gerar análises.")
    else:
        # Sanitização e Tipagem de Dados (Crítico para manipulação no Pandas)
        df_analise["Data"] = pd.to_datetime(df_analise["Data"], errors="coerce")
        df_analise["Carga (kg)"] = pd.to_numeric(df_analise["Carga (kg)"], errors="coerce")
        df_analise["Reps"] = pd.to_numeric(df_analise["Reps"], errors="coerce")
        
        # Remove linhas com falhas na conversão
        df_analise = df_analise.dropna(subset=["Data", "Carga (kg)", "Reps"])
        
        # Cálculo de Métricas Derivadas
        df_analise["Volume Load (kg)"] = df_analise["Carga (kg)"] * df_analise["Reps"]
        df_analise["1RM Estimada (kg)"] = df_analise["Carga (kg)"] * (1 + (df_analise["Reps"] / 30))

        # Controles de Filtro
        col_filtro1, col_filtro2 = st.columns(2)
        with col_filtro1:
            lista_exercicios = df_analise["Exercício"].unique().tolist()
            ex_selecionado = st.selectbox("Selecione o Exercício", lista_exercicios)
        
        with col_filtro2:
            data_min = df_analise["Data"].min().date()
            data_max = df_analise["Data"].max().date()
            
            # Tratamento caso o usuário apague a data no input
            try:
                data_inicio, data_fim = st.date_input("Período", [data_min, data_max])
            except ValueError:
                st.warning("Selecione a data final do período.")
                st.stop()

        # Aplicação dos Filtros
        mask = (
            (df_analise["Exercício"] == ex_selecionado) & 
            (df_analise["Data"].dt.date >= data_inicio) & 
            (df_analise["Data"].dt.date <= data_fim)
        )
        df_filtrado = df_analise.loc[mask]

        if df_filtrado.empty:
            st.warning("Nenhum registro encontrado para este período.")
        else:
            # Agrupamento por Data (Pega a melhor série do dia para o gráfico de progressão)
            df_grouped = df_filtrado.groupby("Data").agg(
                Max_Carga=("Carga (kg)", "max"),
                Max_1RM=("1RM Estimada (kg)", "max"),
                Volume_Total=("Volume Load (kg)", "sum")
            ).reset_index()

            st.divider()
            
            # Gráfico 1: Força (1RM Estimada vs Carga Bruta)
            st.markdown("### Progressão de Força (Melhor Série do Dia)")
            fig_forca = px.line(
                df_grouped, x="Data", y=["Max_1RM", "Max_Carga"],
                labels={"value": "Peso (kg)", "variable": "Métrica"},
                markers=True,
                color_discrete_sequence=["#1f77b4", "#d62728"]
            )
            # Ajuste de layout para melhor visualização na web/mobile
            fig_forca.update_layout(legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
            st.plotly_chart(fig_forca, use_container_width=True)

            # Gráfico 2: Volume de Trabalho
            st.markdown("### Volume Total (Soma das Séries)")
            fig_vol = px.bar(
                df_grouped, x="Data", y="Volume_Total",
                labels={"Volume_Total": "Volume Load (kg)"},
                color="Volume_Total", color_continuous_scale="Viridis"
            )
            st.plotly_chart(fig_vol, use_container_width=True)