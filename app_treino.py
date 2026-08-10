import streamlit as st
import pandas as pd
from streamlit_gsheets import GSheetsConnection
from datetime import date
import plotly.express as px
import plotly.graph_objects as go

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

# --- Funções de Dados: Treino ---
def load_data():
    try:
        df = conn.read(worksheet="Historico", ttl=0)
        df = df.dropna(how="all")
        return df
    except Exception as e:
        st.error(f"Erro ao carregar dados de treino: {e}")
        return pd.DataFrame(columns=["Data", "Treino", "Exercício", "Série", "Carga (kg)", "Reps", "RPE", "Obs"])

def save_data(new_data):
    df = load_data()
    updated_df = pd.concat([df, pd.DataFrame(new_data)], ignore_index=True)
    conn.update(worksheet="Historico", data=updated_df)

# --- Funções de Dados: Peso Corporal ---
def load_peso():
    try:
        df = conn.read(worksheet="Peso", ttl=0)
        df = df.dropna(how="all")
        return df
    except Exception as e:
        st.error("Erro ao carregar dados de peso. Verifique se a aba 'Peso' existe.")
        return pd.DataFrame(columns=["Data", "Peso (kg)"])

def save_peso(new_data):
    df = load_peso()
    updated_df = pd.concat([df, pd.DataFrame(new_data)], ignore_index=True)
    # Ordena cronologicamente para garantir o cálculo correto da média móvel
    updated_df['Data'] = pd.to_datetime(updated_df['Data'])
    updated_df = updated_df.sort_values(by='Data').reset_index(drop=True)
    updated_df['Data'] = updated_df['Data'].dt.strftime('%Y-%m-%d')
    conn.update(worksheet="Peso", data=updated_df)

st.title("Sistema de Telemetria de Treino")

# Criação das 3 abas estruturais
tab_registro, tab_analise, tab_peso = st.tabs([
    "📝 Registro de Treino", 
    "📈 Análise de Evolução", 
    "⚖️ Controle de Peso"
])

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
                        "Data": data_treino.strftime("%Y-%m-%d"),
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

# ==========================================
# ABA 2: ANÁLISE DE EVOLUÇÃO
# ==========================================
with tab_analise:
    st.subheader("Filtros de Análise (Treino)")
    df_analise = load_data()
    
    if not df_analise.empty:
        df_analise["Data"] = pd.to_datetime(df_analise["Data"], errors="coerce")
        df_analise["Carga (kg)"] = pd.to_numeric(df_analise["Carga (kg)"], errors="coerce")
        df_analise["Reps"] = pd.to_numeric(df_analise["Reps"], errors="coerce")
        df_analise = df_analise.dropna(subset=["Data", "Carga (kg)", "Reps"])
        
        df_analise["Volume Load (kg)"] = df_analise["Carga (kg)"] * df_analise["Reps"]
        df_analise["1RM Estimada (kg)"] = df_analise["Carga (kg)"] * (1 + (df_analise["Reps"] / 30))

        col_filtro1, col_filtro2 = st.columns(2)
        with col_filtro1:
            lista_exercicios = df_analise["Exercício"].unique().tolist()
            ex_selecionado = st.selectbox("Selecione o Exercício", lista_exercicios)
        with col_filtro2:
            data_min = df_analise["Data"].min().date()
            data_max = df_analise["Data"].max().date()
            try:
                data_inicio, data_fim = st.date_input("Período de Treino", [data_min, data_max])
            except ValueError:
                st.stop()

        mask = (
            (df_analise["Exercício"] == ex_selecionado) & 
            (df_analise["Data"].dt.date >= data_inicio) & 
            (df_analise["Data"].dt.date <= data_fim)
        )
        df_filtrado = df_analise.loc[mask]

        if not df_filtrado.empty:
            df_grouped = df_filtrado.groupby("Data").agg(
                Max_Carga=("Carga (kg)", "max"),
                Max_1RM=("1RM Estimada (kg)", "max"),
                Volume_Total=("Volume Load (kg)", "sum")
            ).reset_index()

            st.divider()
            st.markdown("### Progressão de Força (Melhor Série)")
            fig_forca = px.line(df_grouped, x="Data", y=["Max_1RM", "Max_Carga"], markers=True)
            fig_forca.update_layout(legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
            st.plotly_chart(fig_forca, use_container_width=True)

            st.markdown("### Volume Total (Soma das Séries)")
            fig_vol = px.bar(df_grouped, x="Data", y="Volume_Total", color="Volume_Total", color_continuous_scale="Viridis")
            st.plotly_chart(fig_vol, use_container_width=True)

# ==========================================
# ABA 3: CONTROLE DE PESO
# ==========================================
with tab_peso:
    col_peso_form, col_peso_chart = st.columns([1, 2])
    
    with col_peso_form:
        st.subheader("Registrar Pesagem")
        with st.form("form_peso"):
            data_peso = st.date_input("Data", date.today())
            peso_atual = st.number_input("Peso (kg)", min_value=30.0, max_value=200.0, step=0.1, value=75.0)
            
            sub_peso = st.form_submit_button("Gravar Peso")
            if sub_peso:
                save_peso([{"Data": data_peso.strftime("%Y-%m-%d"), "Peso (kg)": peso_atual}])
                st.success("Peso registrado!")
                st.rerun()

    with col_peso_chart:
        st.subheader("Análise de Tendência Corporal")
        df_peso = load_peso()
        
        if not df_peso.empty:
            # Tratamento de tipagem
            df_peso["Data"] = pd.to_datetime(df_peso["Data"], errors="coerce")
            df_peso["Peso (kg)"] = pd.to_numeric(df_peso["Peso (kg)"], errors="coerce")
            df_peso = df_peso.dropna().sort_values(by="Data")
            
            # Remove duplicatas (mantém a última pesagem do dia se houver erro de digitação)
            df_peso = df_peso.drop_duplicates(subset=["Data"], keep="last")
            
            # Cálculo da Média Móvel (Janela de 7 dias)
            # Usa min_periods=1 para que o gráfico não fique em branco nos primeiros 6 dias
            df_peso["Média 7 Dias"] = df_peso["Peso (kg)"].rolling(window=7, min_periods=1).mean()
            
            # Renderização Avançada do Gráfico (Plotly Graph Objects para múltiplas camadas)
            fig_peso = go.Figure()
            
            # Pontos isolados de peso diário (ruído/dispersão)
            fig_peso.add_trace(go.Scatter(
                x=df_peso["Data"], y=df_peso["Peso (kg)"],
                mode='markers', name='Peso Diário',
                marker=dict(color='rgba(135, 206, 250, 0.5)', size=8)
            ))
            
            # Linha de tendência sólida (média móvel)
            fig_peso.add_trace(go.Scatter(
                x=df_peso["Data"], y=df_peso["Média 7 Dias"],
                mode='lines', name='Média Móvel (7 Dias)',
                line=dict(color='red', width=3)
            ))
            
            fig_peso.update_layout(
                xaxis_title="Data",
                yaxis_title="Peso (kg)",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=0, r=0, t=30, b=0)
            )
            
            st.plotly_chart(fig_peso, use_container_width=True)
            
            # Resumo Estatístico Rápido
            st.divider()
            ultimos_7 = df_peso.tail(7)
            if len(ultimos_7) >= 2:
                peso_atual = ultimos_7.iloc[-1]["Média 7 Dias"]
                peso_anterior = ultimos_7.iloc[0]["Média 7 Dias"]
                variacao = peso_atual - peso_anterior
                
                st.metric(
                    label="Variação da Média (Últimos 7 registros)", 
                    value=f"{peso_atual:.2f} kg", 
                    delta=f"{variacao:+.2f} kg",
                    delta_color="inverse" # Fica verde se perder, vermelho se ganhar. Remova esta linha se o objetivo for ganho de massa.
                )
        else:
            st.info("Nenhum registro de peso inserido ainda.")