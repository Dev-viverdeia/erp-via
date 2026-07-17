# Guia de Telas — FinanceERP

Referência rápida de todas as páginas do sistema.

---

## 1. Autenticação

### Login (`/login`)
Tela de entrada do sistema. Email + senha via Supabase Auth. Links para "Esqueci minha senha" e "Criar conta".

### Cadastro (`/signup`)
Criação de conta com nome, empresa, email e senha. Envia email de confirmação. Cria automaticamente a empresa (company) e o usuário vinculado.

### Recuperação de Senha (`/reset-password`)
Formulário para solicitar redefinição de senha por email via Supabase Auth.

---

## 2. Dashboard (`/`)

Visão geral financeira com atualização em tempo real.

- **KPI Cards:** Receita do mês, despesas, saldo bancário, inadimplência
- **KPIs Avançados:** MRR, ticket médio, churn, LTV
- **Gráfico Receita vs Despesa:** Barras comparativas dos últimos 6 meses
- **Gráfico Fluxo de Caixa:** Linha com projeção de saldo
- **DRE Resumido:** Card com resultado operacional do mês
- **Aging de Recebíveis:** Gráfico de barras por faixa de atraso (1-30d, 31-60d, 61-90d, 90d+)
- **Receitas Recentes:** Tabela com as últimas receitas registradas

---

## 3. Financeiro

### Receitas (`/receitas`)
Gestão completa de contas a receber.

- **KPIs do mês:** Total contratado, recebido, provisionado
- **Tabela:** Cliente, valor, tipo (Pix/Cartão/Recorrente), parcelas, status, data contratação
- **Filtros:** Busca por cliente, status (ativa/concluída/cancelada), tipo de pagamento
- **Ações:** Criar, editar, ver detalhes (painel lateral com parcelas), cancelar, excluir (soft delete)
- **Exportar CSV**
- **Detalhe:** Painel lateral mostra parcelas individuais com opção de dar baixa manual

### Despesas (`/despesas`)
Gestão de contas a pagar.

- **KPIs do mês:** Pendente, vencido, pago
- **Tabela:** Descrição, parceiro, categoria, vencimento, valor, status
- **Filtros:** Busca, status (pendente/pago/vencido/cancelado), categoria
- **Ações:** Criar, editar, pagar (registra baixa + lançamento contábil automático), excluir
- **Exportar CSV**

### Fluxo de Caixa (`/fluxo-de-caixa`)
Projeção financeira futura.

- **KPIs:** Saldo atual, entradas previstas 30d, saídas previstas 30d, saldo projetado 30d
- **Gráfico de linha:** Projeção de saldo para 30/60/90 dias (toggle)
- **Tabela de movimentações futuras:** Data, descrição, tipo (entrada/saída), valor, status

### Contas Bancárias (`/contas-bancarias`)
Cadastro e controle de contas.

- **KPIs:** Saldo total consolidado, número de contas ativas
- **Tabela:** Banco, agência, conta, tipo (corrente/poupança), saldo, status
- **Ações:** Criar, editar, desativar
- Saldo atualizado automaticamente via trigger ao registrar pagamentos

### Conciliação Bancária (`/conciliacao`)
Importação de extratos e conciliação.

- **Import CSV:** Upload de extrato bancário em CSV para uma conta selecionada
- **KPIs:** Total de transações, conciliadas, pendentes, valor pendente
- **Tabela:** Transações bancárias com status de conciliação
- **Filtros:** Conta bancária, status (todas/conciliadas/pendentes)
- **Auto Conciliar:** Botão que tenta match automático entre transações e receitas/despesas
- **Conciliação manual:** Dialog para vincular transação a uma receita ou despesa

---

## 4. Contabilidade (`/contabilidade`)

Página com 7 abas:

### Plano de Contas
Hierarquia de contas contábeis (ativo, passivo, PL, receita, despesa). CRUD completo. Suporta contas sintéticas e analíticas. Seed automático compatível com Lucro Real.

### Lançamentos
Livro diário com todos os lançamentos contábeis. Mostra automáticos (gerados por triggers) e manuais. Formulário de novo lançamento com múltiplas linhas (débito/crédito). Validação de partida dobrada (D=C).

### Balancete
Balancete de verificação por período. Mostra saldo de cada conta (débito, crédito, saldo). Filtro por período fiscal.

### Razão
Razão contábil de uma conta específica. Seleciona conta + período e exibe todos os lançamentos que movimentaram aquela conta.

### Balanço Patrimonial
Relatório de Balanço Patrimonial. Ativo, Passivo e Patrimônio Líquido agrupados hierarquicamente.

### DFC
Demonstração de Fluxo de Caixa. Atividades operacionais, de investimento e financiamento.

### Períodos Fiscais
Gerenciamento de períodos (mês/ano). Status: aberto, em fechamento, fechado. Fechar período impede novos lançamentos naquele mês.

---

## 5. Gestão

### Controladoria (`/controladoria`)
Análise de custos por centro de custo.

- **Filtros:** Data início e fim
- **Tabela:** Centro de custo, código, total de despesas, % do total, quantidade
- **Gráfico de barras horizontal:** Distribuição visual por centro de custo
- **Exportar CSV**

### Fiscal (`/fiscal`)
Apuração tributária com 3 abas:

- **PIS/COFINS:** Apuração não-cumulativa. Débitos (sobre receitas) e créditos (sobre despesas elegíveis). Saldo a pagar.
- **IRPJ/CSLL:** Apuração trimestral. Base de cálculo, ajustes LALUR (adições/exclusões), imposto devido.
- **Retenções na Fonte:** Listagem de retenções (IR, PIS, COFINS, CSLL) aplicadas sobre pagamentos a PJ.

### Pessoas (`/pessoas`)
Gestão de prestadores e funcionários.

- **Tabela:** Nome, tipo (PJ/CLT), cargo, departamento, salário, status
- **Filtros:** Busca, tipo de contrato
- **Ações:** Criar, editar, ver detalhes (painel com contratos), excluir (soft delete)
- **Detalhe:** Painel lateral com dados do funcionário e lista de contratos. CRUD de contratos.
- **Exportar CSV**

### Parceiros (`/parceiros`)
Cadastro de clientes e fornecedores.

- **Tabela:** Nome, tipo (cliente/fornecedor/ambos), documento, email, telefone
- **Filtros:** Busca, tipo
- **Ações:** Criar, editar, excluir (soft delete)
- **Exportar CSV**

---

## 6. Sistema

### Configurações (`/configuracoes`)
Preferências do sistema com 5 abas:

- **Empresa:** Dados cadastrais (nome, CNPJ, regime tributário, moeda)
- **Categorias:** CRUD de categorias de despesas (hierárquicas, vinculáveis a contas contábeis)
- **Centros de Custo:** CRUD de centros de custo (nome, código, ativo/inativo)
- **Auditoria:** Log de todas as alterações em tabelas críticas (tabela, ação, usuário, data, dados antigos/novos)
- **Integrações:** Configuração de gateways (Appmax, Hubla, CRM). API key, webhook secret, endpoint URL, status ativo/inativo.

---

## Layout Geral

Todas as páginas autenticadas compartilham:

- **Sidebar:** Navegação fixa à esquerda com ícones e labels (colapsável)
- **Header:** Nome do usuário, sino de notificações, trigger de colapsar sidebar
- **Área principal:** Conteúdo com padding, scroll independente
- **Proteção de rota:** Redirect para `/login` se não autenticado
