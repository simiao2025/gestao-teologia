# Proposta de Arquitetura Ideal: "Pragmatic Service-Based"

Considerando o porte do **Teologia System** (Sistema de Gestão Médio com Módulos Financeiro, Acadêmico e Administrativo) e a stack **Next.js + Supabase**, a arquitetura ideal não é nem um "Monólito Espaguete" e nem uma "Clean Architecture Estrita" (que traria complexidade desnecessária).

Recomendo a **Arquitetura Baseada em Serviços e Funcionalidades**.

## 1. O Problema Atual

Atualmente, temos lógica de negócios (regras de validação, chamadas ao Supabase, cálculos) misturada com a UI nos componentes (ex: `MatriculaForm`).

- **Difícil de testar**: Não dá para testar a matrícula sem renderizar o componente.
- **Difícil de reutilizar**: Se precisar matricular via API ou outra tela, a lógica está presa no form.

## 2. A Solução Proposta

### Camadas Sugeridas

1.  **UI Layer (`components/`)**:
    - Puramente visual e interativa.
    - Recebe dados e "avisa" sobre ações do usuário.
    - **NÃO** faz chamadas diretas ao banco/Supabase.
    - **NÃO** contém regras de negócio complexas.

2.  **Service Layer (`services/`)** [NOVA]:
    - Onde vive a regra de negócio.
    - Comunica-se com o Supabase.
    - Retorna dados tipados e trata erros de banco.
    - Ex: `studentService.create(data)`, `financialService.processPayment(id)`.

3.  **Data/State Layer (`hooks/`)**:
    - Conecta a UI aos Services.
    - Gerencia estado de loading, erro e cache (SWR/React Query).
    - Ex: `useStudentEnrollment()` chama `studentService`.

### Nova Estrutura de Pastas Recomendada

```text
app/                  # Rotas (Next.js App Router)
components/
  ui/                 # Shadcn/Radix (Botões, Inputs genéricos)
  features/           # Componentes específicos de negócio
    matricula/
      MatriculaForm.tsx       # Orquestrador (apenas chama hooks e exibe steps)
      steps/
        PersonalDataStep.tsx  # Componente Atômico
        AddressStep.tsx       # Componente Atômico
services/             # [NOVO] Lógica de Negócio Pura
  authService.ts
  studentService.ts   # createStudent, getStudentProfile...
  paymentService.ts
types/                # Definições globais e geradas do Supabase
lib/                  # Configurações (supabase client, utils)
```

## 3. Benefícios

- **Escalabilidade**: Novos módulos seguem o padrão `feature/` + `service/`.
- **Testabilidade**: Podemos testar `studentService.ts` com testes unitários rápidos (Jest/Vitest) sem ligar o React.
- **Manutenibilidade**: O Frontend fica mais leve, focado apenas em exibir dados.

## 4. Como Chegar Lá (Migração Gradual)

Não precisamos reescrever tudo. O **Protocolo de Refatoração Segura** pode ser usado para extrair código dos componentes atuais para services, um por um.
