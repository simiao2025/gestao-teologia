# Arquitetura do IBUC System

> **Regra de Ouro**: Este projeto segue uma **Arquitetura Baseada em Serviços**. Nenhuma lógica de negócio ou chamada direta ao banco deve residir em componentes de UI.

## Estrutura de Diretórios Permitida (Canon)

Apenas os seguintes diretórios de alto nível são permitidos. Refatorações futuras **NÃO** devem criar novos diretórios raiz sem aprovação explícita.

### Camadas de Código

1.  **`app/`**: (Next.js App Router)
    - Contém apenas Páginas (`page.tsx`) e Layouts (`layout.tsx`).
    - **Regra**: Páginas devem ser magras. Devem apenas buscar dados iniciais e chamar Componentes.

2.  **`components/`**: (Camada de Apresentação)
    - Contém componentes React reutilizáveis e específicos.
    - **Regra**: Componentes devem receber dados via props ou hooks.
    - **Subcategorias**:
      - `ui/`: Componentes base do Shadcn UI (buttons, inputs, cards).
      - `[feature]/`: Componentes específicos de funcionalidade (ex: `matricula/`).
      - `[feature]/steps/`: Passos isolados de fluxos complexos.

3.  **`services/`** (Camada de Negócio)
    - **Responsabilidade**: Único local autorizado a importar `lib/supabase.ts`.
    - Contém lógica de negócio, validações complexas e chamadas de dados.
    - Exemplo: `studentService.ts`, `authService.ts`.

4.  **`types/`** (Contratos e Definições)
    - Contém interfaces TypeScript e tipos inferidos do Zod.
    - Exemplo: `student.ts`.

5.  **`hooks/`** (Estado e Composição)
    - Hooks personalizados para conectar UI aos Services.

6.  **`lib/`** (Infraestrutura)
    - Configurações de bibliotecas (Supabase client, utils).

7.  **`constants/`** (Valores Estáticos)
    - Listas fixas, enums, mensagens.

### Diretórios de Sistema/Agente

- `.agent/`: Memória e Skills da IA.
- `scripts/`: Automações de manutenção.
- `public/`: Assets estáticos.

---

## Protocolo de Refatoração

1.  **Nunca** crie pastas como `controllers`, `models`, `views` ou `utils` na raiz. Use `services`, `types` e `lib`.
2.  **Componentes Grandes**: Se um componente passar de 200 linhas, ele deve ser quebrado em sub-componentes ou "Steps".
3.  **Tipagem**: Sempre defina tipos em `types/` antes de codar a lógica.

---

**Este arquivo serve como REGRA para qualquer agente de IA ou desenvolvedor que trabalhe neste repositório.**
