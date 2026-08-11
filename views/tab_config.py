import streamlit as st
from database import salvar_documento, carregar_colecao, deletar_exercicio

def render_tab_config(user_id):
    st.subheader("Gerenciar Estrutura de Treinos")
    col_form_cfg, col_tabela_cfg = st.columns([1, 2])
    
    # Adicionamos "Ordem" na lista de colunas padrão
    df_config = carregar_colecao(user_id, "config_treinos", ["Divisao", "Exercicio", "Series_Padrao", "Ordem"])
    
    with col_form_cfg:
        with st.form("form_novo_exercicio"):
            nova_divisao = st.text_input("Divisão (ex: Pull)")
            novo_exercicio = st.text_input("Exercício")
            novas_series = st.number_input("Séries Padrão", min_value=1, max_value=10, value=3)
            # NOVO: Input para a ordem do exercício
            nova_ordem = st.number_input("Ordem no Treino", min_value=1, value=1, help="1 é o primeiro exercício, 2 o segundo, etc.")
            
            if st.form_submit_button("Adicionar"):
                if nova_divisao and novo_exercicio:
                    salvar_documento(user_id, "config_treinos", {
                        "Divisao": nova_divisao,
                        "Exercicio": novo_exercicio,
                        "Series_Padrao": novas_series,
                        "Ordem": nova_ordem # NOVO: Salva a ordem no Firebase
                    })
                    st.success("Exercício adicionado!")
                    st.rerun()
    
    with col_tabela_cfg:
        if not df_config.empty:
            # Ordenamos a tabela na tela de config só para ficar bonito visualmente
            df_config = df_config.sort_values(by=["Divisao", "Ordem"])
            st.dataframe(df_config, use_container_width=True, hide_index=True)
            
            st.divider()
            ex_remover = st.selectbox("Selecione para excluir", df_config["Exercicio"].tolist())
            if st.button("Excluir Exercício Selecionado", type="primary"):
                deletar_exercicio(user_id, ex_remover)
                st.success(f"Exercício '{ex_remover}' removido!")
                st.rerun()
        else:
            st.info("Nenhum exercício cadastrado. Adicione um ao lado.")