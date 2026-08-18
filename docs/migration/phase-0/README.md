# Fase 0 — Baseline e decisões de produto

Status: **executada em 14/08/2026, aguardando aprovação do checklist e confirmação dos projetos Firebase**.

Esta pasta registra o contrato funcional que orientará a reescrita. Ela separa três categorias:

- comportamento que precisa permanecer;
- limitação atual que deve ser corrigida;
- decisão de produto adotada para permitir o avanço sem depender de definições visuais ou legais finais.

## Artefatos

- [CURRENT_BEHAVIOR.md](CURRENT_BEHAVIOR.md): comportamento observado no código Streamlit;
- [PARITY_CHECKLIST.md](PARITY_CHECKLIST.md): checklist de aceite funcional;
- [PRODUCT_BASELINE.md](PRODUCT_BASELINE.md): plataformas, identidade visual, acessibilidade, dispositivos, métricas e retenção;
- [fixtures/firestore-baseline.json](fixtures/firestore-baseline.json): massa anônima e determinística;
- [fixtures/README.md](fixtures/README.md): cenários e resultados esperados da massa.

## Evidências inspecionadas

| Área | Implementação atual |
| --- | --- |
| Entrada e navegação | `main.py` |
| Autenticação | `auth.py` |
| Persistência | `database.py` |
| Treino guiado | `views/tab_treino_dinamico.py` |
| Registro manual | `views/tab_registro.py` |
| Evolução | `views/tab_analise.py` e `utils.py` |
| Peso | `views/tab_peso.py` e `utils.py` |
| Configurações | `views/tab_config.py` |

Não existe suíte automatizada de testes, schema versionado, configuração Firebase por ambiente ou regras do Firestore no repositório atual.

## Critério de saída da fase

| Critério | Estado | Evidência/pendência |
| --- | --- | --- |
| Fluxos atuais documentados | Concluído | `CURRENT_BEHAVIOR.md` |
| Massa anônima criada | Concluído | `fixtures/firestore-baseline.json` |
| Plataformas e web definidas | Concluído por premissa | Android e iOS; web fora da primeira entrega |
| Identidade e acessibilidade mínimas | Concluído por premissa | `PRODUCT_BASELINE.md` |
| Matriz de dispositivos definida | Concluído por premissa | `PRODUCT_BASELINE.md` |
| Métricas de aceite definidas | Concluído por premissa | `PRODUCT_BASELINE.md` |
| Retenção e exclusão registradas | Proposta, requer validação | Revisão jurídica/produto antes da publicação |
| Ambientes Firebase definidos | Definição lógica concluída | IDs e projetos reais ainda precisam ser provisionados/confirmados |
| Checklist de paridade aprovado | Pendente | Aprovação do responsável pelo produto |

Fase 1 pode começar com Emulator Suite sem aguardar projetos remotos. Uso de dados reais e encerramento formal da Fase 0 dependem das duas pendências acima.
