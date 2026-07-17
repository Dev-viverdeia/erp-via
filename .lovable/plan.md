

# Plano: Refatorar Centros de Custo para Edição Inline em Tabela

## Problema
A UI atual usa tree view com collapsible + dialog modal para criar/editar. O usuario quer edição inline diretamente na tabela, como no codigo de referencia fornecido.

## Solucao

Reescrever `src/components/configuracoes/CostCentersTab.tsx` com o padrao de edição inline:

### Comportamento
- **Tabela com colunas:** Codigo, Nome, Status, Ações
- **Hierarquia visual:** Indentação baseada no codigo (01, 01.01, 01.01.01) com icone `CornerDownRight` para filhos
- **Ordenação:** Pelo codigo hierarquico (01 < 01.01 < 01.02 < 02)
- **Edição inline:** Clicar em Editar transforma a linha em inputs editaveis
- **Criar filho/irmão:** Botões aparecem no hover de cada linha, criam nova linha em modo edicao
- **Botao raiz:** "Adicionar Novo Grupo Principal" no rodape da tabela
- **Atalhos:** Enter salva, Esc cancela
- **Busca:** Input de busca por codigo ou nome no header
- **Ações no hover:** Editar, Excluir, Adicionar Filho, Adicionar Irmão (aparecem apenas no hover)

### Auto-geração de codigo
- Ao adicionar filho de "01", calcula proximo disponivel: "01.01", "01.02", etc
- Ao adicionar irmão de "01.02", calcula "01.03"
- Ao adicionar raiz, calcula "03", "04", etc

### Mapeamento com banco
- `code` usado para hierarquia visual e ordenação
- `parent_id` mantido no banco para integridade referencial
- Ao salvar novo item, deduz `parent_id` a partir do codigo (ex: "01.02" → pai é item com code "01")
- Sem coluna `description` no banco, omitida da tabela (schema atual nao tem)

### Arquivo a modificar
1. **`src/components/configuracoes/CostCentersTab.tsx`** -- reescrita completa com padrao inline

Nenhuma mudanca de banco necessaria -- `parent_id` e `code` ja existem.

