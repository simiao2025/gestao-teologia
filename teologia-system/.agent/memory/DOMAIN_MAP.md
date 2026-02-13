# Mapa de Domínio do Projeto (Gerado via Domain Explorer)

## Glossário Global

| Termo Técnico | Termo de Negócio    | Descrição                                         |
| ------------- | ------------------- | ------------------------------------------------- |
| `Matricula`   | Ficha de Inscrição  | Dados coletados na entrada de um novo estudante.  |
| `Subnucleo`   | Polo/Unidade        | Local físico ou grupo onde as aulas acontecem.    |
| `Monitor`     | Coordenador de Polo | Responsável por um subnúcleo.                     |
| `Nivel`       | Grau Acadêmico      | Classificação do curso (Básico, Médio, Avançado). |
| `Pedido`      | Compra de Material  | Solicitação de livros ou materiais didáticos.     |
| `Progressao`  | Histórico Escolar   | Registro de notas e status em disciplinas.        |

## Entidades Principais e Regras

### Aluno / Matrícula

- **Definição**: O estudante do curso de teologia.
- **Campos Chave**:
  - `cpf`, `rg`: Documentos obrigatórios.
  - `status`: Pode ser `ativo`, `trancado`, `desistente` ou `concluído`.
  - `ja_estudou_teologia`: Booleano para identificar aproveitamento de matérias.
- **Relacionamentos**:
  - Pertence a um **Subnúcleo**.
  - Está matriculado em um **Nível** (Básico, Médio, etc).

### Subnúcleo

- **Definição**: Unidade descentralizada de ensino.
- **Campos Chave**:
  - `cidade`, `estado`: Localização geográfica.
- **Relacionamentos**:
  - Gerenciado por um **Monitor** (monitor_id).

### Disciplina

- **Definição**: Matéria da grade curricular.
- **Campos Chave**:
  - `codigo`: Identificador único da matéria (ex: TEO101).
  - `nivel`: Nível da matéria (`basico`, `medio`, `avancado`).

### Livro / Material Didático

- **Definição**: Produto físico vinculado a uma disciplina.
- **Campos Chave**:
  - `valor`: Preço do material.
- **Relacionamentos**:
  - Vinculado estritamente a uma **Disciplina**.

### Pedido

- **Definição**: Transação de compra de livros.
- **Estados Possíveis**:
  - `pendente` -> `pago` -> `enviado` -> `entregue`.
