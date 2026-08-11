import streamlit as st
from database import salvar_documento, carregar_colecao, deletar_exercicio

def render_tab_config(user_id):
    st.subheader("Gerenciar Estrutura de Treinos")
    col_form_cfg, col_tabela_cfg = st.columns([1, 2])
    
    # Carrega dados via DB
    df_config = carregar_colecao(user_id, "config_treinos", ["Divisao", "Exercicio", "Series_Padrao"])
    
    with col_form_cfg:
        with st.form("form_novo_exercicio"):
            nova_divisao = st.text_input("Divisão (ex: Pull)")
            novo_exercicio = st.text_input("Exercício")
            novas_series = st.number_input("Séries Padrão", min_value=1, max_value=10, value=3)
            
            if st.form_submit_button("Adicionar"):
                if nova_divisao and novo_exercicio:
                    salvar_documento(user_id, "config_treinos", {
                        "Divisao": nova_divisao,
                        "Exercicio": novo_exercicio,
                        "Series_Padrao": novas_series
                    })
                    st.success("Exercício adicionado!")
                    st.rerun()
    
    with col_tabela_cfg:
        if not df_config.empty:
            st.dataframe(df_config, use_container_width=True, hide_index=True)
            
            st.divider()
            ex_remover = st.selectbox("Selecione para excluir", df_config["Exercicio"].tolist())
            if st.button("Excluir Exercício Selecionado", type="primary"):
                deletar_exercicio(user_id, ex_remover)
                st.success(f"Exercício '{ex_remover}' removido!")
                st.rerun()
        else:
            st.info("Nenhum exercício cadastrado. Adicione um ao lado.")