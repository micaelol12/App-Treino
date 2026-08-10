import streamlit as st
import pandas as pd
import os
from streamlit_gsheets import GSheetsConnection
from datetime import date

# Arquivo de persistência de dados
DATA_FILE = "registros_treino.csv"

# Estrutura de Treinos e Exercícios baseada no documento
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
        # Lê a aba chamada "Historico" da sua planilha
        df = conn.read(worksheet="Historico")
        # Remove linhas completamente vazias que o Sheets pode retornar
        df = df.dropna(how="all")
        return df
    except Exception as e:
        st.error("Erro ao carregar dados. Verifique se a planilha está vazia ou inacessível.")
        return pd.DataFrame(columns=["Data", "Treino", "Exercício", "Série", "Carga (kg)", "Reps", "RPE", "Obs"])

def save_data(new_data):
    df = load_data()
    # Concatena os registros antigos com os da sessão atual
    updated_df = pd.concat([df, pd.DataFrame(new_data)], ignore_index=True)
    # Sobrescreve a aba com os dados atualizados
    conn.update(worksheet="Historico", data=updated_df)
    
st.set_page_config(page_title="Controle de Carga de Treino", layout="wide")
st.title("Controle de Carga de Treino (Progressão Dupla)")

# Seleção de Treino e Data
col1, col2 = st.columns(2)
with col1:
    data_treino = st.date_input("Data do Treino", date.today())
with col2:
    treino_selecionado = st.selectbox("Selecione a Divisão", list(TREINOS.keys()))

st.divider()
st.subheader(f"Exercícios - {treino_selecionado}")

exercicios = TREINOS[treino_selecionado]
registros_sessao = []

# Geração dinâmica dos formulários baseada no documento
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
            
            # Adiciona ao buffer apenas se houver repetições registradas
            if reps > 0:
                registros_sessao.append({
                    "Data": data_treino,
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
st.subheader("Histórico de Treinos")
historico_df = load_data()
if not historico_df.empty:
    st.dataframe(historico_df, use_container_width=True)
else:
    st.info("Nenhum treino registrado ainda.")