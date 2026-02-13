---
name: Domain Explorer (Contexto de Negócio)
description: Mapeia o domínio de negócio e gera documentação persistente para contexto.
version: 1.0
---

# Domain Explorer (Contexto de Negócio)

Esta skill tem como objetivo extrair, estruturar e persistir o conhecimento do domínio de negócio da aplicação. Isso é crucial para que múltiplos LLMs possam "entrar" no projeto e entender rapidamente as regras e entidades sem alucinações.

## Objetivo Principal

Gerar e manter atualizado o arquivo `.agent/memory/DOMAIN_MAP.md`.

## Passo 1: Análise de Entidades (Prisma/DB)

1.  **Ler Schema**: Analise o arquivo `prisma/schema.prisma` (ou equivalente).
2.  **Identificar Entidades Core**: Quais são as tabelas principais? (ex: `Aluno`, `Turma`, `Financeiro`).
3.  **Mapear Relacionamentos**: Como elas se conectam? (1:N, N:N).

## Passo 2: Glossário e Terminologia

1.  **Varredura de Código**: Procure por termos recorrentes no código (pasta `types`, `interfaces`, ou nomes de serviços).
2.  **Tradução**: Mapeie termos técnicos para termos de negócio.
    - Ex: `User` (técnico) -> `Membro da Igreja` (negócio).
    - Ex: `Transaction` (técnico) -> `Dízimo/Oferta` (negócio).

## Passo 3: Persistência (Saída)

Escreva ou atualize o arquivo `.agent/memory/DOMAIN_MAP.md` com o seguinte formato:

```markdown
# Mapa de Domínio do Projeto

## Glossário Global

| Termo Técnico | Termo de Negócio | Descrição |
| ------------- | ---------------- | --------- |
| ...           | ...              | ...       |

## Entidades Principais e Regras

### [Nome da Entidade] (ex: Aluno)

- **Definição**: O que representa no mundo real.
- **Relacionamentos**:
  - Pertence a uma `Turma`.
  - Pode ter múltiplos `Pagamentos`.
- **Regras de Negócio Importantes**:
  - (Ex: Não pode ser excluído se tiver pagamentos vinculados).
```

## Como Usar

Execute esta skill sempre que houver mudanças significativas no banco de dados ou quando perceber que o glossário está desatualizado.
