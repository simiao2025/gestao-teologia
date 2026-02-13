---
name: Auditoria de Arquitetura e Code Review
description: Realiza uma análise completa da arquitetura do projeto e revisão de qualidade de código.
version: 1.0
---

# Auditoria de Arquitetura e Code Review

Esta skill guia o agente através de um processo sistemático para auditar a arquitetura de um projeto e revisar a qualidade do código.

## Pré-requisitos

- Acesso de leitura a todo o repositório.
- Conhecimento da stack tecnológica (React, Next.js, Node.js, etc.).

## Passo 1: Análise da Estrutura do Projeto

1.  **Listar Estrutura de Diretórios**: Use `list_dir` para entender a organização de alto nível.
2.  **Identificar Padrões**: Verifique se o projeto segue uma arquitetura conhecida (ex: Feature-Sliced Design, Clean Architecture, ou estrutura padrão Next.js).
3.  **Arquivos de Configuração**: Analise `package.json`, `tsconfig.json`, `.eslintrc.json`, `next.config.js`, etc., para entender as dependências e configurações base.

## Passo 2: Análise de Qualidade de Código

Escolha uma amostragem de arquivos representativos (Componentes, Hooks, Services, Utils) e verifique:

1.  **Princípios SOLID e DRY**: O código é modular? Existe repetição desnecessária?
2.  **React Best Practices**:
    - Uso correto de Hooks (regras de hooks).
    - Memoização (`useMemo`, `useCallback`) onde apropriado.
    - Separação entre lógica e apresentação.
3.  **Tratamento de Erros**: O código lida adequadamente com falhas (try/catch, Error Boundaries)?
4.  **Tipagem (TypeScript)**: Uso de `any`, asserções de tipo perigosas, interfaces bem definidas.

## Passo 3: Performance e Segurança

1.  **Performance**: Procure por renders desnecessários, imports pesados não otimizados, imagens sem otimização.
2.  **Segurança**: Verifique inputs não sanitizados, exposição de segredos, ou práticas vulneráveis conhecidas.

## Passo 4: Geração do Relatório

Gere um relatório em Markdown (`AUDIT_REPORT.md` ou similar) contendo:

### 1. Visão Geral

- Stack detectada.
- Padrão de arquitetura identificado.

### 2. Pontos Fortes

- O que o projeto faz bem.

### 3. Áreas de Melhoria (Classificadas por Prioridade)

- **Crítico**: Problemas que causam bugs ou falhas de segurança.
- **Importante**: Dívida técnica, problemas de performance ou má manutenibilidade.
- **Sugestão**: Melhorias de estilo ou otimizações menores.

### 4. Plano de Ação

- Passos recomendados para resolver os problemas identificados.
