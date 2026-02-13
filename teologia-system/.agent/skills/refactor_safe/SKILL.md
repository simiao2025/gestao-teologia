---
name: Protocolo de Refatoração Segura
description: Protocolo para garantir estabilidade do sistema durante refatorações.
version: 1.0
---

# Protocolo de Refatoração Segura

Esta skill define um processo rigoroso para alterar código existente minimizando o risco de regressões. Use este protocolo SEMPRE que for modificar lógica de negócio ou estrutura existente.

## Diretriz Global: Persistência de Contexto

Ao final de qualquer refatoração significativa, atualize os documentos de contexto relevantes em `.agent/memory/` se eles existirem, para garantir que o próximo agente tenha a visão atualizada.

## Fase 0: Preparação

Antes de qualquer mudança:

1.  **Status do Git**: O diretório de trabalho deve estar limpo.
2.  **Testes Existentes**: Execute os testes relacionados à área que será tocada.
    - Se falharem -> PARE. Corrija-os antes de refatorar.
    - Se passarem -> Prossiga.
3.  **Rede de Segurança**: Se não houver testes, crie um **Teste de Caracterização**.
    - Capture o output atual para um dado input.
    - Garanta que este teste passa.

## Fase 1: Estratégia (Baby Steps)

Planeje a refatoração em passos atômicos.

- Não misture refatoração (mudança de design) com alteração de comportamento (nova feature).
- Se a mudança for grande, quebre em etapas menores.

## Fase 2: Execução (Ciclo Red-Green-Refactor)

Para cada pequeno passo:

1.  **Aplicar Mudança**: Faça a menor alteração possível.
2.  **Verificar Imediatamente**: Rode os testes.
    - **FALHA**: Reverter imediatamente (`git reset --hard` ou desfazer). NÃO tente "consertar rápido". Entenda o erro, repense o passo.
    - **SUCESSO**: Commit temporário ou checkpoint mental.

## Fase 3: Limpeza e Finalização

1.  **Remover Código Morto**: Se algo foi substituído, remova o antigo.
2.  **Melhorar Nomes**: Se variáveis ficaram confusas, renomeie para maior clareza.
3.  **Commit Final**: Faça um commit com mensagem descritiva do que foi alterado e por quê.

## Checklist de Review Pós-Refatoração

- [ ] Todos os testes continuam passando?
- [ ] A legibilidade melhorou?
- [ ] Nenhuma funcionalidade foi perdida?
- [ ] O código respeita os padrões do projeto (Lint/Format)?
