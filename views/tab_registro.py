import streamlit as st
from datetime import date
from database import salvar_lote, carregar_colecao

def extrair_estrutura_dinamica(df_config):
    treinos = {}
    if not df_config.empty:
        for _, row in df_config.iterrows():
            divisao = str(row.get("Divisao", "")).strip()
            exercicio = str(row.get("Exercicio", "")).strip()
            series = int(float(row.get("Series_Padrao", 1)))
            
            if divisao not in treinos:
                treinos[divisao] = {}
            treinos[divisao][exercicio] = series
    return treinos

def render_tab_registro(user_id):
    # Carrega configs via camada de dados
    df_config = carregar_colecao(user_id, "config_treinos", ["Divisao", "Exercicio", "Series_Padrao"])
    treinos_dinamicos = extrair_estrutura_dinamica(df_config)

    if not treinos_dinamicos:
        st.warning("⚠️ Cadastre sua estrutura de treinos na aba '⚙️ Configurações'.")
        return

    col1, col2 = st.columns(2)
    data_treino = col1.date_input("Data do Treino", date.today())
    treino_selecionado = col2.selectbox("Selecione a Divisão", list(treinos_dinamicos.keys()))

    st.divider()
    registros_sessao = []

    with st.form("form_treino"):
        for exercicio, num_series in treinos_dinamicos[treino_selecionado].items():
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
                salvar_lote(user_id, "historico_treinos", registros_sessao)
                st.success("Treino salvo no Firebase!")
                st.rerun()