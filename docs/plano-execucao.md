# Plano de Execução do ERP Financeiro e Contábil

Baseado na análise completa do PRD/PRS (957 linhas), este documento organiza a implementação em **fases incrementais**, cada uma entregando valor funcional testável.

---

## Estado Atual do Projeto

- Frontend com sidebar, tema dark, dashboard com dados mock
- Todas as páginas de módulos são placeholders ("em construção")
- Zero tabelas no Supabase (schema vazio)
- Zero Edge Functions
- Zero migrations

---

## Fase 1 — Fundação e Dados (Backend Core)

**Objetivo:** Criar toda a infraestrutura de banco de dados e autenticação.

**Entregas:**

1. **Migration 001 — Tabelas Core**
   - `companies`, `users` (com ref auth.users), `partners`, `bank_accounts`
   - RLS em todas as tabelas filtrado por `company_id`
   - Campos de auditoria: `created_at`, `updated_at`, `created_by`, `deleted_at`
   - Tipos: decimal(15,2) para valores monetários, UUIDs para IDs

2. **Migration 002 — Tabelas Financeiras**
   - `revenues`, `revenue_installments`, `expenses`, `expense_categories`, `cost_centers`
   - `bank_transactions`
   - Enums/checks para status e tipos de pagamento

3. **Migration 003 — Tabelas Contábeis e Fiscais**
   - `chart_of_accounts`, `journal_entries`, `journal_entry_lines`
   - `fiscal_periods`, `tax_entries`, `withholding_taxes`

4. **Migration 004 — Tabelas de Pessoas e Integração**
   - `employees`, `employee_contracts`
   - `webhook_logs`, `audit_logs`, `integration_configs`

5. **Migration 005 — Seed do Plano de Contas**
   - Plano de contas pré-configurado para empresa de serviços em Lucro Real
   - Categorias de despesas padrão
   - Centros de custo iniciais

6. **Auth e RLS**
   - Configuração de Supabase Auth
   - Políticas RLS em todas as tabelas
   - Helper function para obter `company_id` do usuário logado

**Critério de conclusão:** Todas as tabelas criadas, RLS ativo, seed do plano de contas aplicado.

---

## Fase 2 — CRUD de Parceiros e Contas Bancárias (Frontend + Backend)

**Objetivo:** Primeiras telas funcionais com dados reais do Supabase.

**Entregas:**

1. **Página de Parceiros** (US-F04 parcial)
   - DataTable com listagem, busca, filtros, paginação
   - Formulário de criação/edição em SidePanel
   - StatusBadge, soft delete
   - Hooks: `usePartners`, `useCreatePartner`, `useUpdatePartner`

2. **Página de Contas Bancárias**
   - CRUD completo: banco, agência, conta, tipo, saldo inicial
   - Card de saldo por banco
   - Hooks: `useBankAccounts`

**Critério de conclusão:** Parceiros e contas bancárias podem ser criados, editados, listados e "excluídos" (soft delete) via interface.

---

## Fase 3 — Contas a Pagar (Despesas)

**Objetivo:** Módulo completo de despesas com categorias e centros de custo.

**Entregas:**

1. **Categorias de Despesas e Centros de Custo** — CRUD simples
2. **Página de Despesas** — DataTable, formulário, ações (pagar, cancelar), recorrência, totalizadores

**Critério de conclusão:** Despesas podem ser criadas, pagas, filtradas. Recorrência funciona.

---

## Fase 4 — Contas a Receber (Receitas)

**Objetivo:** Módulo de receitas com provisionamento de parcelas recorrentes.

**Entregas:**

1. **Página de Receitas** — DataTable, SidePanel com parcelas, totalizadores
2. **Formulário de Receita Manual** — Provisionamento automático de 12 installments
3. **Baixa Manual de Parcelas**

**Critério de conclusão:** Receitas manuais funcionam com provisionamento correto.

---

## Fase 5 — Fluxo de Caixa Real

**Objetivo:** Substituir dados mock do dashboard por dados reais.

**Entregas:**

1. **Dashboard com dados reais** — KPIs via queries, Supabase Realtime
2. **Página de Fluxo de Caixa** — Projeção 30/60/90 dias

---

## Fase 6 — Webhooks e Integrações

**Entregas:** Edge Functions para webhook-crm, webhook-appmax, webhook-hubla, cron-overdue

---

## Fase 7 — Contabilidade

**Entregas:** Plano de contas, lançamentos automáticos/manuais, relatórios (DRE, Balanço, Balancete), fechamento de período

---

## Fase 8 — Fiscal

**Entregas:** Apuração PIS/COFINS, IRPJ/CSLL, retenções na fonte

---

## Fase 9 — Conciliação Bancária

**Entregas:** Import OFX/CSV, conciliação automática e manual

---

## Fase 10 — Gestão de Pessoas

**Entregas:** Cadastro PJ/CLT, geração de pagamentos com retenções

---

## Fase 11 — Dashboards Avançados e Exportação

**Entregas:** Dashboard executivo/contábil, exportação PDF/Excel, busca global, API para CRM

---

## Fase 12 — Polimento, Auditoria e Testes

**Entregas:** Audit log automático, notificações, testes, revisão de segurança

---

## Ordem de Execução

```text
Fase  | Descrição                       | Dependências
------|---------------------------------|-------------
  1   | Fundação (schema + RLS + seed)  | Nenhuma
  2   | Parceiros + Contas Bancárias    | Fase 1
  3   | Despesas (Contas a Pagar)       | Fase 2
  4   | Receitas (Contas a Receber)     | Fase 2
  5   | Fluxo de Caixa + Dashboard Real | Fases 3, 4
  6   | Webhooks e Integrações          | Fase 4
  7   | Contabilidade                   | Fases 3, 4
  8   | Fiscal                          | Fase 7
  9   | Conciliação Bancária            | Fase 2
 10   | Gestão de Pessoas               | Fases 3, 8
 11   | Dashboards Avançados + Export   | Fases 7, 8
 12   | Polimento + Testes + Auditoria  | Todas
```
