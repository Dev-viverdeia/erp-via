import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });
    }

    // Get user from token
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), { status: 401, headers: corsHeaders });
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 400, headers: corsHeaders });
    }

    const companyId = profile.company_id;

    // Check if seed already applied (chart_of_accounts has data)
    const { count } = await supabase
      .from("chart_of_accounts")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "Seed already applied" }), { headers: corsHeaders });
    }

    // ========== PLANO DE CONTAS (Lucro Real - Serviços) ==========
    const accounts = [
      // 1 - ATIVO
      { code: "1", name: "ATIVO", type: "asset", nature: "debit", is_analytical: false },
      { code: "1.1", name: "ATIVO CIRCULANTE", type: "asset", nature: "debit", is_analytical: false, parent_code: "1" },
      { code: "1.1.01", name: "Caixa e Equivalentes", type: "asset", nature: "debit", is_analytical: false, parent_code: "1.1" },
      { code: "1.1.01.001", name: "Bancos Conta Movimento", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.01" },
      { code: "1.1.01.002", name: "Aplicações Financeiras", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.01" },
      { code: "1.1.02", name: "Contas a Receber", type: "asset", nature: "debit", is_analytical: false, parent_code: "1.1" },
      { code: "1.1.02.001", name: "Clientes", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.02" },
      { code: "1.1.02.002", name: "Cartões a Receber", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.02" },
      { code: "1.1.03", name: "Impostos a Recuperar", type: "asset", nature: "debit", is_analytical: false, parent_code: "1.1" },
      { code: "1.1.03.001", name: "PIS a Recuperar", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.03" },
      { code: "1.1.03.002", name: "COFINS a Recuperar", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.03" },
      { code: "1.1.03.003", name: "IRRF a Recuperar", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.1.03" },
      { code: "1.2", name: "ATIVO NÃO CIRCULANTE", type: "asset", nature: "debit", is_analytical: false, parent_code: "1" },
      { code: "1.2.01", name: "Imobilizado", type: "asset", nature: "debit", is_analytical: false, parent_code: "1.2" },
      { code: "1.2.01.001", name: "Equipamentos de Informática", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.2.01" },
      { code: "1.2.01.002", name: "Móveis e Utensílios", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.2.01" },
      { code: "1.2.02", name: "Intangível", type: "asset", nature: "debit", is_analytical: false, parent_code: "1.2" },
      { code: "1.2.02.001", name: "Software e Licenças", type: "asset", nature: "debit", is_analytical: true, parent_code: "1.2.02" },

      // 2 - PASSIVO
      { code: "2", name: "PASSIVO", type: "liability", nature: "credit", is_analytical: false },
      { code: "2.1", name: "PASSIVO CIRCULANTE", type: "liability", nature: "credit", is_analytical: false, parent_code: "2" },
      { code: "2.1.01", name: "Fornecedores", type: "liability", nature: "credit", is_analytical: false, parent_code: "2.1" },
      { code: "2.1.01.001", name: "Fornecedores Nacionais", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.01" },
      { code: "2.1.02", name: "Obrigações Trabalhistas", type: "liability", nature: "credit", is_analytical: false, parent_code: "2.1" },
      { code: "2.1.02.001", name: "Salários a Pagar", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.02" },
      { code: "2.1.02.002", name: "Prestadores PJ a Pagar", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.02" },
      { code: "2.1.03", name: "Obrigações Tributárias", type: "liability", nature: "credit", is_analytical: false, parent_code: "2.1" },
      { code: "2.1.03.001", name: "PIS a Recolher", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.03" },
      { code: "2.1.03.002", name: "COFINS a Recolher", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.03" },
      { code: "2.1.03.003", name: "IRPJ a Recolher", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.03" },
      { code: "2.1.03.004", name: "CSLL a Recolher", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.03" },
      { code: "2.1.03.005", name: "ISS a Recolher", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.03" },
      { code: "2.1.03.006", name: "IRRF a Recolher", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.03" },
      { code: "2.1.04", name: "Receita Diferida", type: "liability", nature: "credit", is_analytical: false, parent_code: "2.1" },
      { code: "2.1.04.001", name: "Receita Diferida de Assinaturas", type: "liability", nature: "credit", is_analytical: true, parent_code: "2.1.04" },

      // 3 - PATRIMÔNIO LÍQUIDO
      { code: "3", name: "PATRIMÔNIO LÍQUIDO", type: "equity", nature: "credit", is_analytical: false },
      { code: "3.1", name: "Capital Social", type: "equity", nature: "credit", is_analytical: false, parent_code: "3" },
      { code: "3.1.01", name: "Capital Social Integralizado", type: "equity", nature: "credit", is_analytical: true, parent_code: "3.1" },
      { code: "3.2", name: "Lucros/Prejuízos Acumulados", type: "equity", nature: "credit", is_analytical: false, parent_code: "3" },
      { code: "3.2.01", name: "Lucros Acumulados", type: "equity", nature: "credit", is_analytical: true, parent_code: "3.2" },
      { code: "3.2.02", name: "Resultado do Exercício", type: "equity", nature: "credit", is_analytical: true, parent_code: "3.2" },

      // 4 - RECEITAS
      { code: "4", name: "RECEITAS", type: "revenue", nature: "credit", is_analytical: false },
      { code: "4.1", name: "Receita Operacional", type: "revenue", nature: "credit", is_analytical: false, parent_code: "4" },
      { code: "4.1.01", name: "Receita de Serviços", type: "revenue", nature: "credit", is_analytical: false, parent_code: "4.1" },
      { code: "4.1.01.001", name: "Receita de Assinaturas", type: "revenue", nature: "credit", is_analytical: true, parent_code: "4.1.01" },
      { code: "4.1.01.002", name: "Receita de Serviços Avulsos", type: "revenue", nature: "credit", is_analytical: true, parent_code: "4.1.01" },
      { code: "4.2", name: "Receitas Financeiras", type: "revenue", nature: "credit", is_analytical: false, parent_code: "4" },
      { code: "4.2.01", name: "Juros e Rendimentos", type: "revenue", nature: "credit", is_analytical: true, parent_code: "4.2" },

      // 5 - DESPESAS
      { code: "5", name: "DESPESAS", type: "expense", nature: "debit", is_analytical: false },
      { code: "5.1", name: "Despesas Operacionais", type: "expense", nature: "debit", is_analytical: false, parent_code: "5" },
      { code: "5.1.01", name: "Pessoal", type: "expense", nature: "debit", is_analytical: false, parent_code: "5.1" },
      { code: "5.1.01.001", name: "Salários e Ordenados", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.01" },
      { code: "5.1.01.002", name: "Prestadores de Serviços PJ", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.01" },
      { code: "5.1.01.003", name: "Benefícios", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.01" },
      { code: "5.1.02", name: "Tecnologia", type: "expense", nature: "debit", is_analytical: false, parent_code: "5.1" },
      { code: "5.1.02.001", name: "Servidores e Infraestrutura", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.02" },
      { code: "5.1.02.002", name: "Software e SaaS", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.02" },
      { code: "5.1.02.003", name: "Domínios e Hospedagem", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.02" },
      { code: "5.1.03", name: "Marketing e Vendas", type: "expense", nature: "debit", is_analytical: false, parent_code: "5.1" },
      { code: "5.1.03.001", name: "Publicidade Online", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.03" },
      { code: "5.1.03.002", name: "Ferramentas de Marketing", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.03" },
      { code: "5.1.03.003", name: "Comissões de Vendas", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.03" },
      { code: "5.1.04", name: "Administrativo", type: "expense", nature: "debit", is_analytical: false, parent_code: "5.1" },
      { code: "5.1.04.001", name: "Aluguel", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.04" },
      { code: "5.1.04.002", name: "Escritório e Materiais", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.04" },
      { code: "5.1.04.003", name: "Contabilidade e Jurídico", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.04" },
      { code: "5.1.04.004", name: "Seguros", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.04" },
      { code: "5.1.05", name: "Financeiras", type: "expense", nature: "debit", is_analytical: false, parent_code: "5.1" },
      { code: "5.1.05.001", name: "Taxas Bancárias", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.05" },
      { code: "5.1.05.002", name: "Taxas de Gateway", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.05" },
      { code: "5.1.05.003", name: "Juros e Multas", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.05" },
      { code: "5.1.06", name: "Impostos", type: "expense", nature: "debit", is_analytical: false, parent_code: "5.1" },
      { code: "5.1.06.001", name: "PIS sobre Receita", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.06" },
      { code: "5.1.06.002", name: "COFINS sobre Receita", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.06" },
      { code: "5.1.06.003", name: "ISS", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.1.06" },
      { code: "5.2", name: "Depreciação e Amortização", type: "expense", nature: "debit", is_analytical: false, parent_code: "5" },
      { code: "5.2.01", name: "Depreciação de Imobilizado", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.2" },
      { code: "5.2.02", name: "Amortização de Intangível", type: "expense", nature: "debit", is_analytical: true, parent_code: "5.2" },
    ];

    // Insert accounts in order (parents first) and build a code->id map
    const codeToId: Record<string, string> = {};

    for (const acc of accounts) {
      const parentId = acc.parent_code ? codeToId[acc.parent_code] : null;
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert({
          company_id: companyId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          nature: acc.nature,
          is_analytical: acc.is_analytical,
          parent_id: parentId,
        })
        .select("id")
        .single();

      if (error) {
        console.error(`Error inserting account ${acc.code}:`, error);
        continue;
      }
      codeToId[acc.code] = data.id;
    }

    // ========== CATEGORIAS DE DESPESAS ==========
    const categories = [
      "Pessoal",
      "Tecnologia",
      "Marketing e Vendas",
      "Administrativo",
      "Financeiro",
      "Impostos e Taxas",
      "Escritório",
      "Viagens",
      "Treinamento",
      "Outros",
    ];

    for (const name of categories) {
      await supabase.from("expense_categories").insert({
        company_id: companyId,
        name,
      });
    }

    // ========== CENTROS DE CUSTO ==========
    const costCenters = [
      { name: "Administrativo", code: "ADM" },
      { name: "Comercial", code: "COM" },
      { name: "Operacional", code: "OPE" },
      { name: "Marketing", code: "MKT" },
      { name: "Tecnologia", code: "TEC" },
      { name: "Financeiro", code: "FIN" },
    ];

    for (const cc of costCenters) {
      await supabase.from("cost_centers").insert({
        company_id: companyId,
        name: cc.name,
        code: cc.code,
      });
    }

    return new Response(
      JSON.stringify({ message: "Seed applied successfully", accounts_count: Object.keys(codeToId).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
