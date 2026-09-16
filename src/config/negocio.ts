/**
 * O NEGÓCIO DESTE APP — o único lugar para trocar o nome, as cores e os
 * módulos.
 *
 * Todas as telas leem daqui: o título da aba, a entrada, o menu lateral, o
 * cabeçalho e as rotas. Para adaptar o sistema a um negócio, edite SÓ este
 * arquivo (e troque os logos em `public/` se houver um logo próprio). Não é
 * preciso varrer as telas.
 *
 * Cores em hexadecimal (#rrggbb): a tela converte para o formato do tema.
 * Um módulo desligado some do menu e das rotas; os dados dele continuam
 * guardados e voltam quando ele for religado.
 */

export type ModuloDoNegocio = {
  /** Aparece no menu? */
  ativo: boolean;
  /** O nome que a pessoa lê no menu e no título da tela. */
  titulo: string;
};

export const NEGOCIO = {
  /** O nome do negócio: título da aba, entrada, menu e cabeçalho. */
  nome: "ERP Via",
  /** A frase de abertura na tela de entrada. */
  slogan: "Gestão financeira inteligente.",
  /** O texto de apoio na tela de entrada. */
  descricao:
    "Controle receitas, despesas, contabilidade e fiscal em uma plataforma única, feita para empresas que querem crescer com clareza financeira.",
  /** As cores da marca. `fundo` vazio mantém o fundo escuro do tema. */
  cores: {
    primaria: "#bf95ff",
    destaque: "#64d2ff",
    fundo: "",
  },
  /**
   * Os logos, relativos a `public/`. Vazios, o nome do negócio aparece
   * escrito no lugar do logo.
   */
  logos: {
    claro: "/logo-black.svg",
    escuro: "/logo-white.svg",
    iconeClaro: "/icon-black.svg",
    iconeEscuro: "/icon-white.svg",
  },
  /** Os módulos, na ordem do menu. */
  modulos: {
    dashboard: { ativo: true, titulo: "Dashboard" },
    vendas: { ativo: true, titulo: "Vendas" },
    receitas: { ativo: true, titulo: "Receitas" },
    despesas: { ativo: true, titulo: "Despesas" },
    fluxoDeCaixa: { ativo: true, titulo: "Fluxo de Caixa" },
    clientes: { ativo: true, titulo: "Clientes" },
    fornecedores: { ativo: true, titulo: "Fornecedores" },
    contasBancarias: { ativo: true, titulo: "Contas Bancárias" },
    pessoas: { ativo: true, titulo: "Pessoas" },
    contabilidade: { ativo: true, titulo: "Contabilidade" },
    controladoria: { ativo: true, titulo: "Controladoria" },
    fiscal: { ativo: true, titulo: "Fiscal" },
    conciliacao: { ativo: true, titulo: "Conciliação" },
    configuracoes: { ativo: true, titulo: "Configurações" },
  } satisfies Record<string, ModuloDoNegocio>,
};

export type IdDoModulo = keyof typeof NEGOCIO.modulos;

/** O módulo aparece no menu e nas rotas? */
export function moduloAtivo(id: IdDoModulo): boolean {
  return NEGOCIO.modulos[id].ativo;
}

/** O título do módulo como a pessoa lê. */
export function tituloDoModulo(id: IdDoModulo): string {
  return NEGOCIO.modulos[id].titulo;
}

/** "#bf95ff" → "263 100% 79%", o formato das variáveis do tema. */
export function hexParaHsl(hex: string): string | null {
  const limpo = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(limpo)) return null;
  const r = parseInt(limpo.slice(0, 2), 16) / 255;
  const g = parseInt(limpo.slice(2, 4), 16) / 255;
  const b = parseInt(limpo.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Aplica o nome e as cores do negócio na página: o título da aba e as
 * variáveis do tema. Chamado uma vez, na abertura do app.
 */
export function aplicarNegocio(documento: Document = document): void {
  documento.title = NEGOCIO.nome;
  const raiz = documento.documentElement;
  const primaria = hexParaHsl(NEGOCIO.cores.primaria);
  const destaque = hexParaHsl(NEGOCIO.cores.destaque);
  const fundo = NEGOCIO.cores.fundo ? hexParaHsl(NEGOCIO.cores.fundo) : null;
  if (primaria) {
    raiz.style.setProperty("--primary", primaria);
    raiz.style.setProperty("--ring", primaria);
    raiz.style.setProperty("--sidebar-primary", primaria);
    raiz.style.setProperty("--sidebar-ring", primaria);
  }
  if (destaque) raiz.style.setProperty("--accent", destaque);
  if (fundo) raiz.style.setProperty("--background", fundo);
}
