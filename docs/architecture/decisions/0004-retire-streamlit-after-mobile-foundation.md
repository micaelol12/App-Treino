# ADR 0004 — Retirar o Streamlit após a fundação móvel

- Status: Aceito
- Data: 14/08/2026

## Contexto

A estratégia inicial previa manter Streamlit e React Native em convivência até a
paridade funcional. Após a conclusão da fundação móvel, foi tomada a decisão explícita
de remover o código Streamlit e seguir apenas com o aplicativo React Native.

## Decisão

Remover o código Python, as views Streamlit, suas dependências, o devcontainer Python
e a configuração local de segredos. Manter o baseline da fase 0, as fixtures, os
schemas, os mapeadores e as regras Firestore como proteção do contrato legado.

## Consequências

- existe uma única implementação ativa da interface;
- não é mais necessário sincronizar alterações com o código Streamlit;
- a paridade é medida contra documentação histórica e testes automatizados;
- documentos legados continuam suportados até uma migração de dados própria;
- uma regressão de funcionalidade não pode usar o Streamlit como fallback operacional.
