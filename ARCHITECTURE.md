# ARCHITECTURE.md — PLATAFORMA ERP - VIA

> Este documento e o ponto de partida do Arquiteto. Mantenha-o atualizado ao final de tarefas que mudam estrutura.

## Visao geral

Sistema ERP financeiro completo para empresas brasileiras. Multi-tenant (isolamento por `company_id`). Inclui gestao financeira, contabilidade, fiscal, RH e integracoes com gateways de pagamento.

**Supabase Project ID:** `plddtqltiankiourbvcy`

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript 5.8 + Vite |
| UI | Tailwind CSS 3.4 + shadcn/ui (Radix primitives) |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Data fetching | @tanstack/react-query 5 |
| Charts | Recharts 2.15 |
| Backend | Supabase (PostgreSQL 17, Auth, Edge Functions) |
| Edge Functions | Deno runtime |
| Routing | React Router v6 |
| Testes | Vitest + Testing Library |

## Estrutura de pastas

```
src/
  pages/           # Paginas por rota
  components/
    ui/            # Primitivos shadcn/ui (40+ arquivos)
    layout/        # MainLayout, AppSidebar, AppHeader
    dashboard/     # KPI cards, charts
    revenues/      # Formularios e dialogs de receitas
    expenses/      # Formularios e dialogs de despesas
    contabilidade/ # Plano de contas, lancamentos, relatorios
    fiscal/        # PIS/COFINS, IRPJ/CSLL, retencoes
    conciliacao/   # Reconciliacao bancaria
    configuracoes/ # Perfil, centros de custo, categorias
    partners/      # Gestao de parceiros
    pessoas/       # Funcionarios e contratos
  hooks/           # 32 hooks customizados (CRUD + relatorios)
  contexts/        # AuthContext
  integrations/
    supabase/
      client.ts    # Inicializacao do client
      types.ts     # Tipos gerados do schema
  lib/             # Utilitarios (format, csv, fiscal-constants)

supabase/
  functions/       # Edge Functions (5 functions)
  migrations/      # 20+ migrations
```

## Rotas

| Rota | Pagina | Descricao |
|------|--------|-----------|
| `/` | Index | Dashboard com KPIs |
| `/login` | Login | Autenticacao |
| `/signup` | Signup | Registro |
| `/reset-password` | ResetPassword | Recuperacao de senha |
| `/receitas` | Receitas | Gestao de receitas e parcelas |
| `/despesas` | Despesas | Gestao de despesas |
| `/fluxo-de-caixa` | FluxoDeCaixa | Analise de fluxo de caixa |
| `/parceiros` | Parceiros | Clientes, fornecedores |
| `/contas-bancarias` | ContasBancarias | Contas bancarias |
| `/contabilidade` | Contabilidade | 7 tabs: Plano de contas, Lancamentos, Balancete, Razao, Balanco, DFC, Periodos |
| `/controladoria` | Controladoria | Analytics avancado |
| `/fiscal` | Fiscal | 3 tabs: PIS/COFINS, IRPJ/CSLL, Retencoes |
| `/conciliacao` | Conciliacao | Reconciliacao com import CSV |
| `/pessoas` | Pessoas | Funcionarios e contratos |
| `/configuracoes` | Configuracoes | 5 tabs: Empresa, Centros de custo, Categorias, Integracoes, Audit |

Todas as rotas (exceto auth) protegidas por `ProtectedRoute`.

## Schema do banco (tabelas principais)

### Multi-tenancy
- `companies` — empresa, cnpj, tax_regime (lucro_real/lucro_presumido), fiscal_config
- `users` — id (FK auth.users), company_id, name, email, role

### Financeiro
- `revenues` — receitas (partner_id, payment_type, total_amount, installments_count, status, gateway)
- `revenue_installments` — parcelas (revenue_id, amount, due_date, paid_date, status, bank_account_id)
- `expenses` — despesas (partner_id, category_id, cost_center_id, amount, due_date, status, is_recurring)
- `bank_accounts` — contas bancarias (bank_name, initial_balance, current_balance)
- `bank_transactions` — extrato importado (amount, type, reconciled, reconciled_with_id)

### Parceiros e RH
- `partners` — clientes/fornecedores (type: customer/vendor/both, document, address jsonb)
- `employees` — funcionarios (partner_id, contract_type: pj/clt, salary)
- `employee_contracts` — contratos (employee_id, monthly_value, status)

### Contabilidade
- `chart_of_accounts` — plano de contas ABNT (code, type, nature, parent_id, is_analytical)
- `journal_entries` — lancamentos (entry_date, is_automatic, reference_type/id)
- `journal_entry_lines` — linhas (account_id, debit_amount, credit_amount, partner_id, cost_center_id)
- `fiscal_periods` — periodos fiscais (year, month, status: open/closing/closed)

### Fiscal
- `tax_entries` — apuracao de impostos (tax_type: pis/cofins/irpj/csll, base_amount, rate, tax_amount)
- `withholding_taxes` — retencoes na fonte (expense_id, tax_type, withheld_amount)

### Configuracao
- `cost_centers` — centros de custo (hierarquia com parent_id)
- `expense_categories` — categorias de despesa (hierarquia com parent_id, account_id)
- `integration_configs` — configuracoes de integracoes (provider, api_key_encrypted)
- `audit_logs` — trilha de auditoria (table_name, action, old_data, new_data)
- `webhook_logs` — logs de webhook (source, payload, processed)

### Convencoes de schema
- Todas as tabelas tem `id uuid DEFAULT gen_random_uuid()` como PK
- Multi-tenant: todas filtram por `company_id`
- Soft delete via `deleted_at` (revenues, expenses, partners, employees)
- Timestamps: `created_at`, `updated_at` com `DEFAULT now()`
- Naming: snake_case, FKs no padrao `tabela_id`
- RLS habilitado em TODAS as tabelas
- Check constraints para enums (status, type, etc.)

## Edge Functions

| Function | Tipo | Descricao |
|----------|------|-----------|
| `seed-company-data` | Manual (POST + JWT) | Inicializa plano de contas padrao para nova empresa |
| `cron-overdue` | Cron | Marca parcelas/despesas como "overdue" se vencidas |
| `webhook-hubla` | Webhook | Recebe notificacoes do gateway Hubla |
| `webhook-appmax` | Webhook | Recebe notificacoes do gateway Appmax |
| `webhook-crm` | Webhook | Integracao com CRM externo |

## Padroes de codigo

### Hooks (data fetching)
- `useQuery` para reads, `useMutation` para writes
- Query keys: `[resourceName, ...filters]`
- Todos os hooks em `src/hooks/`
- Pattern: `const { data, isLoading, error } = useQuery({ queryKey: [...], queryFn: ... })`

### Formularios
1. Schema zod com `z.object({...})`
2. `useForm` com `resolver: zodResolver(schema)`
3. `useMutation` para submit
4. Toast (sonner) para feedback

### Componentes de UI
- Dialogs de confirmacao: `AlertDialog`
- Formularios em painel lateral: `Sheet` (slide da direita)
- Tabelas: componente `DataTable` customizado
- Estados obrigatorios: loading (Skeleton), error, empty, success

### Contabilidade automatica
- `useAutoJournalEntry` cria lancamentos automaticos:
  - Pagamento receita → D: Banco, C: Receita
  - Pagamento despesa → D: Despesa, C: Banco
  - Marcados com `is_automatic: true`

## Integracoes externas

- **Hubla** — gateway de pagamento (webhook)
- **Appmax** — gateway de pagamento (webhook)
- **CRM** — sincronizacao de dados (webhook)
- Import/export CSV para reconciliacao bancaria
