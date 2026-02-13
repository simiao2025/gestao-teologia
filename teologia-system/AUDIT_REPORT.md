# Relatório de Auditoria de Arquitetura

**Data**: 04/02/2026
**Versão da Skill**: 1.0

## 1. Visão Geral

- **Stack**: Next.js 14 (App Router), React 18, Supabase (Auth/DB), TailwindCSS, Shadcn UI.
- **Padrão Arquitetural**: Híbrido. Mistura de Client Components com lógica pesada e chamadas diretas ao Supabase. Uso de Zod para validação.

## 2. Pontos Fortes

- **Validação Robusta**: Uso extensivo de `zod` e `react-hook-form` (`lib/validations.ts`).
- **UI Moderna**: Baseada em Shadcn UI/Radix e Tailwind.
- **Singleton Supabase**: Implementação correta do cliente Supabase (`lib/supabase.ts`) prevenindo múltiplas instâncias.
- **Tipagem**: Definições de tipos TypeScript presentes para entidades do banco.

## 3. Áreas de Melhoria (Classificadas)

### 🔴 Crítico (Segurança e Estabilidade)

1.  **Imagens Permitidas de Qualquer Origem**:
    - Em `next.config.js`, `remotePatterns: hostname: '**'` permite carregar imagens de qualquer lugar, expondo a riscos de XSS ou injeção de conteúdo malicioso.
2.  **Linting Ignorado no Build**:
    - `eslint.ignoreDuringBuilds: true` em `next.config.js` permite que código com erros de lint vá para produção.

### 🟡 Importante (Manutenibilidade e Performance)

1.  **Componentes Monolíticos**:
    - `MatriculaForm` (`matricula-form.tsx`) tem **~600 linhas**. Mistura validação, chamadas de API (fetch e RPCs `criar_aluno`), lógica de UI e feedback. Difícil de testar e manter.
2.  **Lógica de Negócio no Frontend**:
    - Regras como validação de CPF e lógica de envio de Magic Link estão acopladas diretamente no componente visual.
3.  **Tipagem Manual do Supabase**:
    - As interfaces em `lib/supabase.ts` são manuais. Se o banco mudar, o código quebra silenciosamente. Recomendado usar `supabase gen types` para gerar tipos automáticos.

### 🟢 Sugestão (Boas Práticas)

1.  **Refatoração de Hooks**:
    - Extrair lógica de busca de dados (Subnúcleos, Níveis) para hooks customizados (`useSubnucleos`, `useNiveis`) ou Server Actions.
2.  **Remoção de Código Morto/Comentado**:
    - Limpeza geral para manter o projeto enxuto.

## 4. Plano de Ação Recomendado

1.  **Imediato**: Restringir domínios de imagem no `next.config.js` e habilitar lint no build.
2.  **Curto Prazo (Protocolo Refactor Safe)**:
    - Quebrar `MatriculaForm` em sub-componentes (`PersonalDataStep`, `AddressStep`, etc).
    - Extrair chamadas `supabase.rpc` para uma camada de Service (`services/studentService.ts`).
3.  **Médio Prazo**:
    - Integrar geração automática de tipos do Supabase.
