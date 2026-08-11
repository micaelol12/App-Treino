import streamlit as st
import pandas as pd

from datetime import date
from database import carregar_colecao, salvar_lote

# --- GERENCIAMENTO DE ESTADO ---
def resetar_treino():
    """Limpa a memória RAM do servidor para finalizar ou abortar um treino."""
    st.session_state.treino_ativo = False
    st.session_state.dados_sessao = {}
    st.session_state.exercicio_atual_idx = 0
    st.session_state.treino_selecionado = None
    st.session_state.data_treino = None

def salvar_dados_tela_atual(exercicio, num_series):
    """Lê os valores preenchidos na tela atual e joga pro dicionário oculto antes de trocar de aba."""
    for s in range(num_series):
        st.session_state.dados_sessao[exercicio][s] = {
            "carga": st.session_state.get(f"c_{exercicio}_{s}", 0.0),
            "reps": st.session_state.get(f"r_{exercicio}_{s}", 0),
            "rpe": st.session_state.get(f"rpe_{exercicio}_{s}", 8),
            "obs": st.session_state.get(f"o_{exercicio}_{s}", "")
        }

# --- CALLBACKS DE NAVEGAÇÃO ---
def btn_proximo(exercicio, num_series):
    salvar_dados_tela_atual(exercicio, num_series)
    st.session_state.exercicio_atual_idx += 1

def btn_anterior(exercicio, num_series):
    salvar_dados_tela_atual(exercicio, num_series)
    st.session_state.exercicio_atual_idx -= 1

def finalizar_treino(user_id, exercicio, num_series):
    salvar_dados_tela_atual(exercicio, num_series)
    
    registros = []
    # Varre o dicionário oculto gerando a lista pro banco de dados
    for ex, series_list in st.session_state.dados_sessao.items():
        for s_idx, s_data in enumerate(series_list):
            # Filtro Antispam: Só salva no banco se o usuário fez pelo menos 1 repetição
            if s_data['reps'] > 0: 
                registros.append({
                    "Data": st.session_state.data_treino.strftime("%Y-%m-%d"),
                    "Treino": st.session_state.treino_selecionado,
                    "Exercício": ex,
                    "Série": s_idx + 1,
                    "Carga": s_data['carga'],
                    "Reps": s_data['reps'],
                    "RPE": s_data['rpe'],
                    "Obs": s_data['obs']
                })
    
    if registros:
        salvar_lote(user_id, "historico_treinos", registros)
        st.session_state.mensagem_sucesso = "Sessão de treino gravada com sucesso! 💪"
    
    resetar_treino()

# --- RENDERIZAÇÃO DA INTERFACE ---
def render_tab_treino_dinamico(user_id):
    # Inicializa variáveis de estado na primeira execução
    if 'treino_ativo' not in st.session_state:
        resetar_treino()

    # Mostra mensagem de sucesso se o treino acabou de ser finalizado
    if getattr(st.session_state, 'mensagem_sucesso', None):
        st.success(st.session_state.mensagem_sucesso)
        st.session_state.mensagem_sucesso = None # Limpa a mensagem

    df_config = carregar_colecao(user_id, "config_treinos", ["Divisao", "Exercicio", "Series_Padrao", "Ordem"])
    
    treinos = {}
    if not df_config.empty:
        # TRATAMENTO DE ERRO CRÍTICO: 
        # Se você já tem exercícios salvos no banco sem o campo "Ordem", 
        # isso vai dar erro. Preenchemos com 99 para jogá-los pro final.
        if "Ordem" not in df_config.columns:
            df_config["Ordem"] = 99
        else:
            df_config["Ordem"] = pd.to_numeric(df_config["Ordem"], errors='coerce').fillna(99)

        # ORDENAÇÃO ACONTECE AQUI:
        df_config = df_config.sort_values(by="Ordem")

        for _, row in df_config.iterrows():
            div = str(row.get("Divisao", "")).strip()
            ex = str(row.get("Exercicio", "")).strip()
            ser = int(float(row.get("Series_Padrao", 1)))
            
            if div not in treinos:
                treinos[div] = {}
            
            # Como o Python >= 3.7 respeita a ordem de inserção em dicionários,
            # os exercícios entrarão no `treinos[div]` exatamente na ordem 1, 2, 3...
            treinos[div][ex] = ser

    if not treinos:
        st.warning("⚠️ Cadastre sua estrutura de treinos na aba '⚙️ Configurações'.")
        return

    # ==========================================
    # TELA 1: SELECIONAR TREINO
    # ==========================================
    if not st.session_state.treino_ativo:
        st.subheader("Iniciar Sessão de Treino")
        col1, col2 = st.columns(2)
        data_treino = col1.date_input("Data", date.today())
        divisao = col2.selectbox("Divisão", list(treinos.keys()))
        
        if st.button("🚀 Iniciar Treino", type="primary", use_container_width=True):
            st.session_state.treino_ativo = True
            st.session_state.data_treino = data_treino
            st.session_state.treino_selecionado = divisao
            st.session_state.lista_exercicios = list(treinos[divisao].items()) # Salva a ordem exata
            
            # Pré-popula o dicionário vazio em memória para suportar ida e volta nas telas
            for ex, ser in st.session_state.lista_exercicios:
                st.session_state.dados_sessao[ex] = [{"carga": 0.0, "reps": 0, "rpe": 8, "obs": ""} for _ in range(ser)]
            
            st.rerun()

    # ==========================================
    # TELA 2: TREINO ATIVO (DINÂMICO)
    # ==========================================
    else:
        divisao = st.session_state.treino_selecionado
        idx = st.session_state.exercicio_atual_idx
        exercicio_atual, num_series = st.session_state.lista_exercicios[idx]
        total_exercicios = len(st.session_state.lista_exercicios)

        st.markdown(f"### 🏋️‍♂️ {divisao}")
        
        # Barra de Progresso visual
        progresso = (idx) / (total_exercicios - 1) if total_exercicios > 1 else 1.0
        st.progress(progresso)
        
        st.markdown(f"## Exercício {idx + 1}/{total_exercicios}: {exercicio_atual}")

        # Renderiza os Inputs daquela série específica
        for s in range(num_series):
            # Lê do estado o que foi preenchido antes (caso o usuário tenha clicado em "Voltar")
            dados_temp = st.session_state.dados_sessao[exercicio_atual][s]
            
            c1, c2, c3, c4 = st.columns([1, 1, 1, 2])
            # A `key` dinâmica amarra o widget diretamente à variável do Streamlit
            c1.number_input("Carga (kg)", min_value=0.0, step=1.0, value=float(dados_temp['carga']), key=f"c_{exercicio_atual}_{s}")
            c2.number_input("Reps", min_value=0, step=1, value=int(dados_temp['reps']), key=f"r_{exercicio_atual}_{s}")
            c3.number_input("RPE", min_value=1, max_value=10, value=int(dados_temp['rpe']), key=f"rpe_{exercicio_atual}_{s}")
            c4.text_input("Obs", value=dados_temp['obs'], key=f"o_{exercicio_atual}_{s}")
            
        st.divider()
        
        # Botões de Navegação (Usando callbacks para capturar os dados ANTES do Rerun)
        c_prev, c_next, c_fin = st.columns(3)
        
        if idx > 0:
            c_prev.button("⬅️ Anterior", on_click=btn_anterior, args=(exercicio_atual, num_series), use_container_width=True)
        
        if idx < total_exercicios - 1:
            c_next.button("Próximo ➡️", type="primary", on_click=btn_proximo, args=(exercicio_atual, num_series), use_container_width=True)
        else:
            c_fin.button("✅ Finalizar Treino", type="primary", on_click=finalizar_treino, args=(user_id, exercicio_atual, num_series), use_container_width=True)
            
        # Botão de fuga no final da página
        st.write("")
        st.button("❌ Abortar Treino (Perder tudo)", on_click=resetar_treino)