**PRD / PRS**

Product Requirements Document

**ERP Financeiro e Contabil**

Plataforma de Gestao para Empresa B2B de Ensino sobre IA

|                   |                         |
|-------------------|-------------------------|
| **Versao**        | 1.0                     |
| **Data**          | 28 de Fevereiro de 2026 |
| **Status**        | Em Revisao              |
| **Stack**         | Supabase + Lovable      |
| **Classificacao** | Confidencial            |

**PARTE 1**

**PRODUCT REQUIREMENTS DOCUMENT (PRD)**

**1. Visao do Produto**

**1.1 Problema**

A empresa opera com um faturamento mensal de R\$ 8-12 milhoes em vendas B2B de acesso anual a uma plataforma de ensino sobre IA. Atualmente, o controle financeiro e fragmentado: gateways de pagamento (Appmax e Hubla) operam de forma independente, nao ha contabilidade integrada, o provisionamento de receita recorrente e manual, e a visibilidade sobre o fluxo de caixa real e limitada. Com o regime de Lucro Real, a empresa precisa de controle contabil rigoroso para apuracao de PIS/COFINS nao-cumulativo, IRPJ e CSLL.

**1.2 Solucao**

Um ERP customizado focado em gestao financeira e contabilidade, construido sobre Supabase + Lovable, que centraliza todas as transacoes financeiras, automatiza lancamentos contabeis em partida dobrada, provisiona receita recorrente conforme normas contabeis, e fornece demonstracoes financeiras (DRE, Balanco, DFC) em tempo real. O sistema integra-se com o CRM proprio e gateways de pagamento existentes via webhooks e APIs.

**1.3 Visao de Sucesso**

Em 5 meses, a empresa tera um sistema unico onde:

- Toda venda que entra via Appmax/Hubla e automaticamente registrada, contabilizada e provisionada.

- A equipe financeira tem visibilidade em tempo real de receitas, despesas, fluxo de caixa e demonstracoes contabeis.

- A conciliacao bancaria de multiplas contas e semi-automatica.

- A apuracao fiscal do Lucro Real (PIS/COFINS, IRPJ, CSLL) e calculada pelo sistema.

- A transicao de contabilidade externa para interna e viabilizada com dados confiaveis e auditaveis.

**1.4 Metricas de Sucesso**

|                                     |                          |                    |
|-------------------------------------|--------------------------|--------------------|
| **Metrica**                         | **Estado Atual**         | **Meta com ERP**   |
| **Tempo de fechamento mensal**      | 5-7 dias uteis (manual)  | 1-2 dias uteis     |
| **Visibilidade de fluxo de caixa**  | Planilhas, atrasado dias | Tempo real         |
| **Conciliacao bancaria**            | 100% manual              | \> 80% automatica  |
| **Provisionamento de recorrencia**  | Manual / inexistente     | 100% automatico    |
| **Tempo para gerar DRE**            | Depende do contador      | Instantaneo (view) |
| **Confianca nos dados financeiros** | Baixa (multiplas fontes) | Alta (fonte unica) |

**2. Escopo e Limites**

**2.1 Dentro do Escopo (In Scope)**

|                          |                                                                                                                               |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Area**                 | **Descricao**                                                                                                                 |
| **Contas a Receber**     | Registro automatico de vendas via webhook, provisionamento de parcelas recorrentes, baixa automatica, gestao de inadimplencia |
| **Contas a Pagar**       | Cadastro de despesas (fixas, recorrentes, variaveis), agendamento, categorias, centros de custo, flag de credito PIS/COFINS   |
| **Fluxo de Caixa**       | Visao consolidada e por banco, projecao baseada em recebiveis e pagaveis, realizado vs. previsto                              |
| **Conciliacao Bancaria** | Import OFX/CSV, match automatico e manual, multiplas contas                                                                   |
| **Contabilidade**        | Plano de contas, lancamentos em partida dobrada (auto + manual), razao, balancete, fechamento de periodo                      |
| **Demonstracoes**        | DRE, Balanco Patrimonial, DFC (direto e indireto), exportacao PDF/Excel                                                       |
| **Fiscal**               | Apuracao PIS/COFINS nao-cumulativo, base IRPJ/CSLL, retencoes na fonte, estrutura LALUR                                       |
| **Gestao de Pessoas**    | Cadastro PJ/CLT, contratos, pagamentos com retencoes, estrutura preparada para folha CLT futura                               |
| **Integracoes**          | Webhooks de CRM proprio, Appmax e Hubla. API de consulta para CRM.                                                            |
| **Dashboards**           | Financeiro (MRR, aging, saldos) e contabil (DRE, indicadores) com atualizacao em tempo real                                   |

**2.2 Fora do Escopo (Out of Scope)**

|                            |                                                              |
|----------------------------|--------------------------------------------------------------|
| **Item**                   | **Motivo**                                                   |
| CRM / Pipeline de Vendas   | Sistema proprio ja existente e operacional                   |
| Checkout / Cobranca        | Integrado direto com Appmax via API (projeto separado)       |
| Emissao de NFSe            | Sistema separado ja emite. Integracao futura.                |
| Estoque / Inventario       | Produto 100% digital, sem estoque fisico                     |
| Manufatura / Supply Chain  | Nao aplicavel ao modelo de negocio                           |
| E-commerce / POS           | Nao aplicavel                                                |
| Roles/Permissoes avancadas | 3-4 usuarios, sem necessidade imediata. Estrutura preparada. |
| Geracao SPED (arquivo)     | Fase futura. Estrutura de dados compativel sera preparada.   |

**3. Personas e Jornadas do Usuario**

**3.1 Personas**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Persona 1: Analista Financeiro</strong></p>
<p>Responsavel pelo dia-a-dia financeiro. Registra despesas, acompanha recebiveis, faz conciliacao bancaria, gera relatorios para a diretoria. Precisa de agilidade e confianca nos dados. Usa o ERP diariamente, varias horas por dia.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Persona 2: Diretor / CEO</strong></p>
<p>Precisa de visao executiva: quanto entrou, quanto saiu, qual o caixa, como esta o MRR, qual a inadimplencia. Usa dashboards, nao entra em detalhes operacionais. Acessa o ERP 1-2x por dia para checar numeros.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Persona 3: Contador / Controller (futuro interno)</strong></p>
<p>Precisa das demonstracoes contabeis, plano de contas, lancamentos, apuracao fiscal. Faz fechamento mensal, gera balancete, confere partida dobrada. Usa o ERP intensamente no fechamento e pontualmente durante o mes.</p></td>
</tr>
</tbody>
</table>

**3.2 Jornadas Criticas**

**Jornada 1: Nova venda entra no sistema**

1.  Cliente fecha contrato de R\$ 40.000 (12x recorrente) no CRM proprio.

2.  CRM envia webhook para o ERP com dados da venda (cliente, valor, forma de pagamento, gateway).

3.  ERP Edge Function recebe, valida idempotency e cria o registro de receita.

4.  Sistema cria 12 parcelas: 1a como \'paga\' (confirmada pelo gateway), 11 como \'provisionadas\'.

5.  Lancamentos contabeis automaticos: receita realizada (1a parcela) + receita diferida (11 parcelas).

6.  Dashboard atualiza em tempo real: MRR sobe, recebiveis aumentam, fluxo de caixa projetado atualiza.

7.  Analista financeiro recebe notificacao de nova venda registrada.

**Jornada 2: Parcela recorrente e cobrada**

8.  No mes seguinte, Appmax cobra automaticamente R\$ 3.333,33 no cartao do cliente.

9.  Appmax envia webhook de pagamento confirmado para o ERP.

10. ERP identifica a parcela \#2 provisionada e muda status para \'paga\'.

11. Lancamento contabil automatico: transfere de receita diferida para receita realizada.

12. Saldo da conta bancaria (Appmax) atualiza no fluxo de caixa.

**Jornada 3: Fechamento mensal contabil**

13. Controller acessa modulo contabil no final do mes.

14. Confere balancete de verificacao (debitos = creditos).

15. Revisa lancamentos automaticos e faz ajustes manuais se necessario.

16. Executa apuracao fiscal: PIS/COFINS (debitos sobre receita - creditos sobre despesas).

17. Gera DRE, Balanco Patrimonial e DFC do periodo.

18. Fecha o periodo fiscal (trava novos lancamentos naquele mes).

19. Exporta relatorios em PDF para arquivo e para o escritorio contabil (durante transicao).

**Jornada 4: Conciliacao bancaria**

20. Analista financeiro faz download do extrato OFX do banco.

21. Importa no ERP. Sistema tenta conciliar automaticamente por valor + data + referencia.

22. \~80% dos itens sao conciliados automaticamente.

23. Analista revisa itens pendentes e faz match manual.

24. Itens sem correspondencia sao sinalizados para investigacao.

25. Saldo conciliado do banco e comparado com saldo do ERP. Diferenca gera alerta.

**4. User Stories e Criterios de Aceitacao**

**4.1 Modulo Financeiro - Contas a Receber**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F01</strong></td>
<td>Como <strong>sistema</strong>, quero <strong>receber webhook do CRM com dados de nova venda e criar automaticamente o registro de receita com todas as parcelas</strong>, para <em>toda venda seja rastreada financeiramente desde o momento da contratacao</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Webhook com idempotency_key duplicada retorna 200 sem criar registro duplicado.</p>
<p><strong>✓</strong> Venda PIX/cartao a vista cria 1 parcela com status 'paid'.</p>
<p><strong>✓</strong> Venda recorrente 12x cria 12 parcelas: 1 'paid' + 11 'provisioned' com due_dates mensais.</p>
<p><strong>✓</strong> Campos obrigatorios: partner_id, total_amount, payment_type, gateway, gateway_ref.</p>
<p><strong>✓</strong> Registro criado aparece imediatamente na tela de receitas.</p>
<p><strong>✓</strong> Lancamento contabil e gerado automaticamente via trigger.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F02</strong></td>
<td>Como <strong>sistema</strong>, quero <strong>receber webhook de pagamento do gateway (Appmax/Hubla) e dar baixa automatica na parcela correspondente</strong>, para <em>os recebiveis reflitam a realidade do que foi efetivamente cobrado</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Parcela identificada por gateway_ref + installment_number.</p>
<p><strong>✓</strong> Status muda de 'provisioned' para 'paid', paid_date e paid_amount sao preenchidos.</p>
<p><strong>✓</strong> Lancamento contabil de realizacao de receita e gerado (receita diferida -&gt; receita realizada).</p>
<p><strong>✓</strong> Se parcela ja esta 'paid', webhook e ignorado (idempotencia).</p>
<p><strong>✓</strong> Log do webhook e registrado em webhook_logs independente do resultado.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F03</strong></td>
<td>Como <strong>sistema</strong>, quero <strong>marcar automaticamente parcelas vencidas como 'overdue' e gerar alerta</strong>, para <em>a inadimplencia seja identificada proativamente</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Job pg_cron roda diariamente as 07:00 UTC.</p>
<p><strong>✓</strong> Parcelas com status 'provisioned' e due_date &lt; hoje mudam para 'overdue'.</p>
<p><strong>✓</strong> Dashboard exibe contador de parcelas overdue e valor total.</p>
<p><strong>✓</strong> Parcelas overdue ha mais de 90 dias sao candidatas a PDD.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F04</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>visualizar todas as receitas com filtros por periodo, status, gateway e cliente</strong>, para <em>ter controle sobre o que foi vendido, recebido e o que esta pendente</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Tela lista receitas com colunas: cliente, valor total, tipo, parcelas pagas/total, status, data.</p>
<p><strong>✓</strong> Filtros funcionais: periodo, status (active/overdue/completed/cancelled), gateway, cliente.</p>
<p><strong>✓</strong> Click em uma receita abre detalhe com todas as parcelas e historico.</p>
<p><strong>✓</strong> Totalizadores no topo: total vendido, total recebido, total a receber, total overdue.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F05</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>visualizar aging de recebiveis (a vencer, 1-30, 31-60, 61-90, 90+ dias)</strong>, para <em>entender a saude dos recebiveis e tomar acoes de cobranca</em>.</td>
<td><strong>SHOULD HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> View materializada mv_receivables_aging calcula aging por faixa.</p>
<p><strong>✓</strong> Grafico de barras empilhadas no dashboard.</p>
<p><strong>✓</strong> Drill-down por faixa mostra parcelas individuais.</p></td>
</tr>
</tbody>
</table>

**4.2 Modulo Financeiro - Contas a Pagar**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F10</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>cadastrar despesas (unicas e recorrentes) com categoria, centro de custo e data de vencimento</strong>, para <em>controlar todas as saidas de dinheiro da empresa</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Formulario com campos: fornecedor, descricao, valor, categoria, centro de custo, vencimento, recorrencia.</p>
<p><strong>✓</strong> Despesas recorrentes geram automaticamente proxima ocorrencia ao ser paga.</p>
<p><strong>✓</strong> Flag pis_cofins_credit disponivel para marcar despesas que geram credito fiscal.</p>
<p><strong>✓</strong> Despesa criada gera lancamento contabil automatico ao ser marcada como paga.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F11</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>visualizar calendario de pagamentos com valores por semana/mes</strong>, para <em>planejar o fluxo de caixa e nao perder vencimentos</em>.</td>
<td><strong>SHOULD HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Visao de calendario com dots indicando vencimentos.</p>
<p><strong>✓</strong> Visao de lista com filtros por status, periodo, categoria.</p>
<p><strong>✓</strong> Alerta para despesas vencendo nos proximos 7 dias.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F12</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>registrar pagamentos a prestadores PJ com calculo automatico de retencoes (IR, PIS, COFINS, CSLL)</strong>, para <em>as retencoes estejam corretas e rastreadas para a DIRF</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Ao registrar pagamento PJ &gt; R$ 5.000 (ou conforme regra), sistema sugere retencoes aplicaveis.</p>
<p><strong>✓</strong> Retencoes sao registradas na tabela withholding_taxes vinculadas a despesa.</p>
<p><strong>✓</strong> Valor liquido (valor bruto - retencoes) e o que aparece no contas a pagar.</p>
<p><strong>✓</strong> Relatorio anual de retencoes por fornecedor disponivel.</p></td>
</tr>
</tbody>
</table>

**4.3 Modulo Financeiro - Fluxo de Caixa e Conciliacao**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F20</strong></td>
<td>Como <strong>diretor</strong>, quero <strong>visualizar fluxo de caixa consolidado e por conta bancaria, com projecao futura</strong>, para <em>tomar decisoes baseadas na posicao de caixa real e projetada</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Dashboard mostra saldo atual consolidado e por banco.</p>
<p><strong>✓</strong> Grafico de linha com projecao 30/60/90 dias baseado em recebiveis + pagaveis agendados.</p>
<p><strong>✓</strong> Filtro por conta bancaria.</p>
<p><strong>✓</strong> Indicador de 'dias de caixa' (saldo atual / media de despesas diarias).</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-F21</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>importar extrato bancario (OFX/CSV) e conciliar automaticamente com registros do ERP</strong>, para <em>garantir que os saldos do ERP reflitam a realidade bancaria</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Upload de arquivo OFX ou CSV com parser para extrair transacoes.</p>
<p><strong>✓</strong> Algoritmo de match: valor exato + data (+/- 3 dias) + referencia parcial.</p>
<p><strong>✓</strong> Transacoes matched automaticamente ficam como 'sugeridas' para confirmacao.</p>
<p><strong>✓</strong> Interface para match manual de itens nao identificados.</p>
<p><strong>✓</strong> Apos conciliacao, saldo do banco no ERP atualiza.</p>
<p><strong>✓</strong> Diferenca entre saldo extrato e saldo ERP exibida claramente.</p></td>
</tr>
</tbody>
</table>

**4.4 Modulo de Contabilidade**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-C01</strong></td>
<td>Como <strong>controller</strong>, quero <strong>manter um plano de contas hierarquico configuravel compativel com Lucro Real</strong>, para <em>as demonstracoes contabeis sigam as normas brasileiras</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Plano de contas seed pre-configurado para empresa de servicos em Lucro Real.</p>
<p><strong>✓</strong> Contas organizadas: Ativo, Passivo, PL, Receitas, Deducoes, Custos, Despesas.</p>
<p><strong>✓</strong> Cada conta tem: codigo hierarquico, nome, tipo, natureza (D/C), flag analitica/sintetica.</p>
<p><strong>✓</strong> Contas sinteticas agregam saldos das analiticas automaticamente.</p>
<p><strong>✓</strong> Interface visual em arvore para navegacao do plano de contas.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-C02</strong></td>
<td>Como <strong>sistema</strong>, quero <strong>gerar lancamentos contabeis automaticos em partida dobrada para toda transacao financeira</strong>, para <em>a contabilidade esteja sempre atualizada sem intervencao manual</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Toda receita paga gera: D - Banco / C - Receita de Servicos.</p>
<p><strong>✓</strong> Toda receita recorrente provisionada gera: D - Contas a Receber / C - Receita Diferida.</p>
<p><strong>✓</strong> Toda realizacao de parcela recorrente gera: D - Receita Diferida / C - Receita + D - Banco / C - Contas a Receber.</p>
<p><strong>✓</strong> Toda despesa paga gera: D - Conta de Despesa (pela categoria) / C - Banco.</p>
<p><strong>✓</strong> fn_create_journal_entry() REJEITA lancamento onde SUM(debito) != SUM(credito).</p>
<p><strong>✓</strong> Lancamentos automaticos sao marcados com is_automatic=true e reference_type/id.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-C03</strong></td>
<td>Como <strong>controller</strong>, quero <strong>criar lancamentos contabeis manuais para ajustes e reclassificacoes</strong>, para <em>fazer correcoes e ajustes de fechamento</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Formulario com: data, descricao, e N linhas (conta, debito, credito, descricao).</p>
<p><strong>✓</strong> Validacao em tempo real: soma de debitos deve igualar soma de creditos.</p>
<p><strong>✓</strong> Botao 'Salvar' desabilitado enquanto lancamento estiver desbalanceado.</p>
<p><strong>✓</strong> Funcionalidade de 'estorno' que cria lancamento inverso referenciando o original.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-C04</strong></td>
<td>Como <strong>controller</strong>, quero <strong>fechar periodo fiscal mensal com travamento de lancamentos</strong>, para <em>garantir integridade das demonstracoes contabeis publicadas</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Botao 'Fechar Periodo' disponivel apenas se nao ha inconsistencias (balancete equilibrado).</p>
<p><strong>✓</strong> Apos fechamento, nenhum INSERT/UPDATE em journal_entries com entry_date naquele periodo.</p>
<p><strong>✓</strong> Trigger trg_check_fiscal_period bloqueia a operacao com erro explicativo.</p>
<p><strong>✓</strong> Reabertura possivel apenas por admin com campo de justificativa obrigatorio.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-C05</strong></td>
<td>Como <strong>controller</strong>, quero <strong>visualizar DRE, Balanco Patrimonial e DFC em tela e exportar em PDF/Excel</strong>, para <em>ter as demonstracoes prontas para analise e compartilhamento</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> DRE: Receita Bruta -&gt; Deducoes -&gt; Receita Liquida -&gt; Custos -&gt; Lucro Bruto -&gt; Despesas -&gt; Resultado.</p>
<p><strong>✓</strong> Balanco: Ativo Circulante + Nao Circulante = Passivo + PL.</p>
<p><strong>✓</strong> DFC: Metodo direto e indireto (toggle).</p>
<p><strong>✓</strong> Filtro por periodo (mes, trimestre, ano, customizado).</p>
<p><strong>✓</strong> Comparativo periodo atual vs. anterior.</p>
<p><strong>✓</strong> Exportacao em PDF formatado e Excel com dados brutos.</p></td>
</tr>
</tbody>
</table>

**4.5 Modulo Fiscal**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-T01</strong></td>
<td>Como <strong>controller</strong>, quero <strong>apurar PIS/COFINS nao-cumulativo do periodo, com debitos sobre receita e creditos sobre despesas elegiveis</strong>, para <em>cumprir obrigacao fiscal do Lucro Real corretamente</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Debito PIS (0,65%) e COFINS (3%) calculados sobre receita realizada do periodo.</p>
<p><strong>✓</strong> Creditos PIS/COFINS calculados sobre despesas marcadas com pis_cofins_credit=true.</p>
<p><strong>✓</strong> Resultado: Imposto devido = Debitos - Creditos.</p>
<p><strong>✓</strong> Se credito &gt; debito, saldo credor transferido para periodo seguinte.</p>
<p><strong>✓</strong> Tela de apuracao mostra detalhamento de debitos e creditos.</p>
<p><strong>✓</strong> Valores gerados alimentam tax_entries para historico e relatorio.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-T02</strong></td>
<td>Como <strong>controller</strong>, quero <strong>apurar base de IRPJ e CSLL trimestralmente</strong>, para <em>preparar o recolhimento correto dos impostos sobre o lucro</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Base de calculo = Lucro liquido contabil + adicoes - exclusoes.</p>
<p><strong>✓</strong> Interface para registro de adicoes e exclusoes (Parte A do LALUR).</p>
<p><strong>✓</strong> Aliquotas aplicadas: IRPJ 15% + adicional 10% (sobre excedente de R$ 60k/trimestre), CSLL 9%.</p>
<p><strong>✓</strong> Valores apurados sao registrados em tax_entries.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-T03</strong></td>
<td>Como <strong>controller</strong>, quero <strong>controlar retencoes de impostos sobre pagamentos a PJ</strong>, para <em>manter controle para DIRF e aproveitamento de creditos</em>.</td>
<td><strong>SHOULD HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Calculo automatico de retencoes ao registrar pagamento PJ (conforme tabela de servicos).</p>
<p><strong>✓</strong> Relatorio de retencoes por fornecedor e por tipo de imposto.</p>
<p><strong>✓</strong> Totalizacao anual por CNPJ para DIRF.</p></td>
</tr>
</tbody>
</table>

**4.6 Modulo de Gestao de Pessoas**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-P01</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>cadastrar prestadores PJ e funcionarios CLT com dados contratuais e bancarios</strong>, para <em>manter base unificada de quem recebe pagamentos</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Formulario com: nome, CPF/CNPJ, tipo (PJ/CLT), dados bancarios, valor mensal.</p>
<p><strong>✓</strong> Upload de contrato via Supabase Storage.</p>
<p><strong>✓</strong> Prestador PJ e automaticamente criado como partner (tipo vendor).</p>
<p><strong>✓</strong> Registro gera conta a pagar recorrente mensal.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-P02</strong></td>
<td>Como <strong>analista financeiro</strong>, quero <strong>gerar pagamentos mensais a prestadores PJ com retencoes calculadas</strong>, para <em>automatizar o ciclo de pagamento de pessoas</em>.</td>
<td><strong>SHOULD HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Acao 'Gerar pagamentos do mes' cria despesas para todos os prestadores ativos.</p>
<p><strong>✓</strong> Retencoes calculadas automaticamente conforme regra fiscal.</p>
<p><strong>✓</strong> Lista de pagamentos gerada para conferencia antes de confirmacao.</p></td>
</tr>
</tbody>
</table>

**4.7 Modulo de Integracoes**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-I01</strong></td>
<td>Como <strong>sistema</strong>, quero <strong>normalizar webhooks de diferentes origens (CRM, Appmax, Hubla) em um formato unificado interno</strong>, para <em>a logica financeira seja independente do gateway ou sistema de origem</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Edge Function dedicada por origem: /webhooks/crm, /webhooks/appmax, /webhooks/hubla.</p>
<p><strong>✓</strong> Cada function valida signature/token do webhook, parseia payload e normaliza.</p>
<p><strong>✓</strong> Formato normalizado interno e o mesmo independente da origem.</p>
<p><strong>✓</strong> Todo webhook raw e salvo em webhook_logs antes do processamento.</p>
<p><strong>✓</strong> Em caso de erro, webhook_logs.error_message e preenchido e alerta e gerado.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-I02</strong></td>
<td>Como <strong>CRM</strong>, quero <strong>consultar status financeiro de um cliente via API do ERP</strong>, para <em>o time de vendas saiba se o cliente esta em dia</em>.</td>
<td><strong>SHOULD HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Endpoint: GET /api/partners/{id}/financial-summary.</p>
<p><strong>✓</strong> Retorna: total_revenue, total_paid, total_pending, total_overdue, installments_detail.</p>
<p><strong>✓</strong> Autenticacao via API Key.</p>
<p><strong>✓</strong> Rate limit: 100 req/min.</p></td>
</tr>
</tbody>
</table>

**4.8 Modulo de Dashboards**

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-D01</strong></td>
<td>Como <strong>diretor</strong>, quero <strong>ver dashboard executivo com MRR, receita, despesas, saldo e inadimplencia atualizado em tempo real</strong>, para <em>ter visao instantanea da saude financeira da empresa</em>.</td>
<td><strong>MUST HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> Cards: Receita do mes, Despesas do mes, Resultado, Saldo total, MRR, Taxa de inadimplencia.</p>
<p><strong>✓</strong> Graficos: Receita vs. Despesa (12 meses), Fluxo de caixa projetado (90 dias), Aging de recebiveis.</p>
<p><strong>✓</strong> Atualizacao via Supabase Realtime (sem refresh manual).</p>
<p><strong>✓</strong> Periodo selecionavel: mes atual, trimestre, YTD, customizado.</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 67%" />
<col style="width: 17%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>US-D02</strong></td>
<td>Como <strong>controller</strong>, quero <strong>ver dashboard contabil com DRE resumida, indicadores e comparativos</strong>, para <em>acompanhar resultados contabeis sem entrar nos detalhes</em>.</td>
<td><strong>SHOULD HAVE</strong></td>
</tr>
<tr class="even">
<td><strong>AC</strong></td>
<td colspan="2"><p><strong>✓</strong> DRE resumida (Receita -&gt; Resultado) comparativo mes atual vs anterior.</p>
<p><strong>✓</strong> Indicadores: Margem liquida, EBITDA, Ticket medio.</p>
<p><strong>✓</strong> Comparativo: Realizado vs. Orcado (quando orcamento for implementado).</p></td>
</tr>
</tbody>
</table>

**PARTE 2**

**PRODUCT REQUIREMENTS SPECIFICATION (PRS)**

**5. Requisitos Funcionais Detalhados**

Cada requisito funcional e identificado com um codigo unico, priorizacao MoSCoW e rastreabilidade ate a User Story correspondente.

**5.1 Processamento de Vendas (RF-100)**

|            |                                                                                                     |            |            |          |
|------------|-----------------------------------------------------------------------------------------------------|------------|------------|----------|
| **ID**     | **Requisito**                                                                                       | **Prior.** | **US Ref** | **Fase** |
| **RF-101** | Sistema deve receber webhooks HTTP POST com payload JSON de CRM, Appmax e Hubla                     | **MUST**   | US-I01     | Fase 1   |
| **RF-102** | Sistema deve validar idempotency_key/gateway_ref e rejeitar duplicatas retornando HTTP 200          | **MUST**   | US-F01     | Fase 1   |
| **RF-103** | Sistema deve criar registro revenue com status, valor total, tipo de pagamento e gateway            | **MUST**   | US-F01     | Fase 1   |
| **RF-104** | Para pagamento recorrente 12x, sistema deve criar 12 revenue_installments com due_dates mensais     | **MUST**   | US-F01     | Fase 1   |
| **RF-105** | Para pagamento a vista (Pix/cartao), sistema deve criar 1 installment com status \'paid\'           | **MUST**   | US-F01     | Fase 1   |
| **RF-106** | Webhook de pagamento do gateway deve dar baixa na installment correspondente (provisioned -\> paid) | **MUST**   | US-F02     | Fase 1   |
| **RF-107** | Webhook de falha/cancelamento deve marcar installment como overdue ou cancelled                     | **MUST**   | US-F02     | Fase 1   |
| **RF-108** | Job diario (pg_cron) deve marcar installments vencidas como overdue automaticamente                 | **MUST**   | US-F03     | Fase 1   |
| **RF-109** | Todo webhook recebido deve ser logado em webhook_logs com payload original e resultado              | **MUST**   | US-I01     | Fase 1   |

**5.2 Contas a Pagar (RF-200)**

|            |                                                                                               |            |            |          |
|------------|-----------------------------------------------------------------------------------------------|------------|------------|----------|
| **ID**     | **Requisito**                                                                                 | **Prior.** | **US Ref** | **Fase** |
| **RF-201** | Sistema deve permitir cadastro de despesas com valor, vencimento, categoria e centro de custo | **MUST**   | US-F10     | Fase 1   |
| **RF-202** | Despesas recorrentes devem gerar automaticamente proxima ocorrencia ao serem pagas            | **MUST**   | US-F10     | Fase 1   |
| **RF-203** | Sistema deve permitir flag pis_cofins_credit para despesas que geram credito fiscal           | **MUST**   | US-F10     | Fase 1   |
| **RF-204** | Pagamento de despesa PJ deve calcular retencoes (IR, PIS, COFINS, CSLL) automaticamente       | **MUST**   | US-F12     | Fase 3   |
| **RF-205** | Sistema deve exibir calendario de vencimentos com indicadores visuais                         | **SHOULD** | US-F11     | Fase 1   |

**5.3 Contabilidade (RF-300)**

|            |                                                                                                    |            |            |          |
|------------|----------------------------------------------------------------------------------------------------|------------|------------|----------|
| **ID**     | **Requisito**                                                                                      | **Prior.** | **US Ref** | **Fase** |
| **RF-301** | Sistema deve prover plano de contas hierarquico editavel com seed para Lucro Real                  | **MUST**   | US-C01     | Fase 2   |
| **RF-302** | Toda transacao financeira (receita paga, despesa paga) deve gerar lancamento contabil automatico   | **MUST**   | US-C02     | Fase 2   |
| **RF-303** | fn_create_journal_entry() deve REJEITAR lancamentos onde SUM(debito) != SUM(credito)               | **MUST**   | US-C02     | Fase 2   |
| **RF-304** | Receita recorrente provisionada deve gerar: D-Contas a Receber / C-Receita Diferida                | **MUST**   | US-C02     | Fase 2   |
| **RF-305** | Realizacao de parcela recorrente deve gerar: D-Rec.Diferida/C-Receita + D-Banco/C-Contas a Receber | **MUST**   | US-C02     | Fase 2   |
| **RF-306** | Sistema deve permitir lancamentos manuais com validacao de partida dobrada em tempo real           | **MUST**   | US-C03     | Fase 2   |
| **RF-307** | Sistema deve permitir fechamento de periodo fiscal com travamento de lancamentos                   | **MUST**   | US-C04     | Fase 2   |
| **RF-308** | Sistema deve gerar DRE, Balanco Patrimonial e DFC via views materializadas                         | **MUST**   | US-C05     | Fase 2   |
| **RF-309** | Sistema deve gerar Balancete de Verificacao e Razao Contabil por conta e periodo                   | **MUST**   | US-C05     | Fase 2   |
| **RF-310** | Relatorios contabeis devem ser exportaveis em PDF e Excel                                          | **MUST**   | US-C05     | Fase 2   |

**5.4 Fiscal (RF-400)**

|            |                                                                                          |            |            |          |
|------------|------------------------------------------------------------------------------------------|------------|------------|----------|
| **ID**     | **Requisito**                                                                            | **Prior.** | **US Ref** | **Fase** |
| **RF-401** | Sistema deve apurar PIS (0,65%) e COFINS (3%) sobre receita realizada do periodo         | **MUST**   | US-T01     | Fase 3   |
| **RF-402** | Sistema deve calcular creditos PIS/COFINS sobre despesas com flag pis_cofins_credit=true | **MUST**   | US-T01     | Fase 3   |
| **RF-403** | Sistema deve calcular saldo de PIS/COFINS (debito - credito) e transportar saldo credor  | **MUST**   | US-T01     | Fase 3   |
| **RF-404** | Sistema deve apurar base de IRPJ/CSLL trimestralmente com adicoes e exclusoes (LALUR)    | **MUST**   | US-T02     | Fase 3   |
| **RF-405** | Sistema deve calcular retencoes IR/PIS/COFINS/CSLL sobre pagamentos a PJ                 | **MUST**   | US-T03     | Fase 3   |
| **RF-406** | Sistema deve gerar relatorio de retencoes por fornecedor (base DIRF)                     | **SHOULD** | US-T03     | Fase 3   |

**5.5 Conciliacao Bancaria (RF-500)**

|            |                                                                                             |            |            |          |
|------------|---------------------------------------------------------------------------------------------|------------|------------|----------|
| **ID**     | **Requisito**                                                                               | **Prior.** | **US Ref** | **Fase** |
| **RF-501** | Sistema deve importar extratos bancarios nos formatos OFX e CSV                             | **MUST**   | US-F21     | Fase 3   |
| **RF-502** | Algoritmo de conciliacao automatica: match por valor exato + data (+/- 3 dias) + referencia | **MUST**   | US-F21     | Fase 3   |
| **RF-503** | Interface de conciliacao manual com lista de itens pendentes e busca                        | **MUST**   | US-F21     | Fase 3   |
| **RF-504** | Conciliacao deve atualizar current_balance da bank_account correspondente                   | **MUST**   | US-F21     | Fase 3   |
| **RF-505** | Alerta quando diferenca entre saldo extrato e saldo ERP exceder tolerancia configuravel     | **SHOULD** | US-F21     | Fase 3   |

**6. Requisitos Nao-Funcionais**

**6.1 Performance (RNF-P)**

|             |                                                         |                                |
|-------------|---------------------------------------------------------|--------------------------------|
| **ID**      | **Requisito**                                           | **Metrica**                    |
| **RNF-P01** | Processamento de webhook (recebimento ate persistencia) | \< 500ms p95                   |
| **RNF-P02** | Carregamento de tela de listagem (receitas, despesas)   | \< 1s com ate 10.000 registros |
| **RNF-P03** | Geracao de DRE/Balanco via materialized view            | \< 2s                          |
| **RNF-P04** | Conciliacao automatica de 500 transacoes bancarias      | \< 10s                         |
| **RNF-P05** | Dashboard deve atualizar via Realtime                   | \< 2s apos evento              |
| **RNF-P06** | Exportacao de relatorio PDF (DRE 12 meses)              | \< 5s                          |

**6.2 Seguranca (RNF-S)**

|             |                                                                                          |
|-------------|------------------------------------------------------------------------------------------|
| **ID**      | **Requisito**                                                                            |
| **RNF-S01** | Autenticacao via Supabase Auth com sessao JWT. MFA preparado para ativacao futura.       |
| **RNF-S02** | Row Level Security (RLS) ativo em todas as tabelas, filtrado por company_id.             |
| **RNF-S03** | Webhooks validados por signature/secret token. Rejeitar webhooks nao autenticados.       |
| **RNF-S04** | Dados sensiveis (API keys, bank_info) criptografados em repouso via pgcrypto ou vault.   |
| **RNF-S05** | Audit log automatico em todas as tabelas financeiras e contabeis (INSERT/UPDATE/DELETE). |
| **RNF-S06** | Comunicacao exclusivamente via HTTPS/TLS. Nenhum endpoint HTTP exposto.                  |
| **RNF-S07** | Backups automaticos diarios do Supabase com retencao minima de 30 dias.                  |

**6.3 Confiabilidade (RNF-R)**

|             |                                                                                                     |
|-------------|-----------------------------------------------------------------------------------------------------|
| **ID**      | **Requisito**                                                                                       |
| **RNF-R01** | Disponibilidade: 99.5% uptime mensal (alinhado com SLA do Supabase Pro).                            |
| **RNF-R02** | Zero perda de dados financeiros: todo webhook deve ser persistido ANTES do processamento.           |
| **RNF-R03** | Idempotencia: processamento duplicado de webhook nao deve gerar efeitos colaterais.                 |
| **RNF-R04** | Integridade contabil: impossivel criar lancamento desbalanceado (enforced via DB constraint).       |
| **RNF-R05** | Retry automatico: webhooks com falha de processamento devem entrar em fila de retry (3 tentativas). |

**6.4 Usabilidade (RNF-U)**

|             |                                                                                       |
|-------------|---------------------------------------------------------------------------------------|
| **ID**      | **Requisito**                                                                         |
| **RNF-U01** | Interface responsiva para desktop (resolucao minima 1280x720). Mobile e nice-to-have. |
| **RNF-U02** | Navegacao principal em sidebar com acesso a todos os modulos em 1 clique.             |
| **RNF-U03** | Feedback visual imediato em toda acao do usuario (loading, success, error states).    |
| **RNF-U04** | Busca global que encontra parceiros, receitas, despesas e lancamentos contabeis.      |
| **RNF-U05** | Onboarding: usuario novo deve conseguir navegar o sistema sem treinamento formal.     |

**6.5 Manutenibilidade (RNF-M)**

|             |                                                                                                    |
|-------------|----------------------------------------------------------------------------------------------------|
| **ID**      | **Requisito**                                                                                      |
| **RNF-M01** | Migracao de banco via Supabase migrations versionadas e reversiveis.                               |
| **RNF-M02** | Edge Functions com testes unitarios. Cobertura minima de 80% para funcoes financeiras e contabeis. |
| **RNF-M03** | Codigo TypeScript com tipagem estrita (strict mode) no frontend Lovable/React.                     |
| **RNF-M04** | Documentacao tecnica: schema do banco, payloads de webhook e fluxos contabeis documentados.        |
| **RNF-M05** | Ambiente de staging com dados de teste para validacao antes de deploy em producao.                 |

**7. Matriz de Rastreabilidade**

Rastreamento completo: Objetivo de Negocio -\> User Story -\> Requisito Funcional -\> Fase de Entrega.

|                           |                  |                |                       |          |
|---------------------------|------------------|----------------|-----------------------|----------|
| **Objetivo de Negocio**   | **User Stories** | **Requisitos** | **Modulo**            | **Fase** |
| **Centralizar receitas**  | US-F01..F05      | RF-101..109    | Financeiro - Receitas | Fase 1   |
| **Controlar despesas**    | US-F10..F12      | RF-201..205    | Financeiro - Despesas | Fase 1/3 |
| **Visibilidade de caixa** | US-F20           | (views)        | Financeiro - Caixa    | Fase 1   |
| **Conciliar bancos**      | US-F21           | RF-501..505    | Conciliacao           | Fase 3   |
| **Contabilidade interna** | US-C01..C05      | RF-301..310    | Contabilidade         | Fase 2   |
| **Compliance fiscal**     | US-T01..T03      | RF-401..406    | Fiscal                | Fase 3   |
| **Gestao de pessoas**     | US-P01..P02      | (cadastro)     | Pessoas               | Fase 3   |
| **Integracao sistemas**   | US-I01..I02      | RF-101,109     | Integracoes           | Fase 1   |
| **Visao executiva**       | US-D01..D02      | (dashboards)   | Dashboards            | Fase 1/4 |

**8. Dependencias, Premissas e Restricoes**

**8.1 Dependencias Externas**

|                        |                                                           |                                                                                    |
|------------------------|-----------------------------------------------------------|------------------------------------------------------------------------------------|
| **Dependencia**        | **Descricao**                                             | **Risco se indisponivel**                                                          |
| **Supabase**           | Banco PostgreSQL, Auth, Edge Functions, Realtime, Storage | Sistema inteiro inoperante. Mitigacao: backups e plano de contingencia.            |
| **Appmax API/Webhook** | Webhooks de pagamento confirmado e falho                  | Receitas nao baixadas automaticamente. Mitigacao: reconciliacao manual.            |
| **Hubla API/Webhook**  | Webhooks de pagamento confirmado                          | Idem Appmax.                                                                       |
| **CRM Proprio**        | Webhook de nova venda + API de consulta                   | Vendas nao registradas automaticamente. Mitigacao: cadastro manual.                |
| **Lovable**            | Plataforma de desenvolvimento do frontend React           | Desenvolvimento do frontend pausado. Mitigacao: exportar codigo e continuar local. |

**8.2 Premissas**

- Os webhooks do Appmax e Hubla contem todos os dados necessarios (valor, parcela, gateway_ref, cliente) sem necessidade de consulta adicional a API.

- O CRM proprio tem capacidade de enviar webhooks HTTP POST com payload JSON estruturado.

- O regime tributario (Lucro Real) e as aliquotas de PIS/COFINS nao mudarao durante o desenvolvimento.

- O Supabase Pro (ou superior) sera utilizado para garantir Edge Functions, pg_cron e backups adequados.

- O contador validara as regras de apuracao fiscal antes da implementacao da Fase 3.

- 3-4 usuarios simultaneos; nao ha necessidade de otimizacao para alta concorrencia.

**8.3 Restricoes**

- Stack fixo: Supabase + Lovable. Nenhuma outra tecnologia de backend ou frontend sera introduzida.

- Edge Functions rodam em Deno (nao Node.js). Bibliotecas devem ser compativeis.

- PostgreSQL e o unico banco de dados. Nao sera usado NoSQL.

- Sem mobile app nativo. Interface web responsiva apenas.

- Sem integracao direta com Open Banking nesta versao. Import manual de OFX/CSV.

**9. Glossario**

|                               |                                                                                                   |
|-------------------------------|---------------------------------------------------------------------------------------------------|
| **Termo**                     | **Definicao**                                                                                     |
| **MRR**                       | Monthly Recurring Revenue. Receita recorrente mensal baseada em assinaturas ativas.               |
| **Churn**                     | Cancelamento de assinatura pelo cliente antes do termino do contrato.                             |
| **Receita Diferida**          | Receita recebida antecipadamente que sera reconhecida ao longo do tempo (parcelas futuras).       |
| **PDD**                       | Provisao para Devedores Duvidosos. Reserva contabil para recebiveis com risco de nao recebimento. |
| **Partida Dobrada**           | Principio contabil: todo lancamento tem debito e credito de mesmo valor.                          |
| **LALUR**                     | Livro de Apuracao do Lucro Real. Obrigatorio para empresas em Lucro Real.                         |
| **PIS/COFINS Nao-Cumulativo** | Regime onde o imposto pago na cadeia anterior gera credito. Aplicavel ao Lucro Real.              |
| **DRE**                       | Demonstracao do Resultado do Exercicio. Relatorio de receitas, custos e despesas do periodo.      |
| **DFC**                       | Demonstracao de Fluxo de Caixa. Movimentacoes de caixa classificadas por atividade.               |
| **OFX**                       | Open Financial Exchange. Formato padrao de extrato bancario eletronico.                           |
| **RLS**                       | Row Level Security. Funcionalidade do PostgreSQL que filtra dados por politica no nivel da linha. |
| **Edge Function**             | Funcao serverless do Supabase executada em Deno, usada para webhooks e logica de backend.         |
| **Idempotencia**              | Propriedade onde processar a mesma requisicao multiplas vezes produz o mesmo resultado.           |
| **MoSCoW**                    | Priorizacao: Must have, Should have, Could have, Won\'t have.                                     |
| **Webhook**                   | Chamada HTTP automatica de um sistema para outro quando um evento ocorre.                         |

**Fim do Documento PRD/PRS v1.0**

*Aguardando revisao e aprovacao para inicio do desenvolvimento.*

*Apos aprovacao, proximo passo: Schema SQL da Fase 1 para deploy no Supabase.*
