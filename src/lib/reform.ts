import type { CategoriaItem, MixReceitaItem } from './types';

/**
 * Categorias de produtos/serviços conforme a LC 214/2025 (regulamentação da
 * Reforma Tributária - EC 132/2023), com seus percentuais de redução da
 * alíquota do CBS/IBS. Valores de referência (Nota Técnica MF, nov/2024).
 */
export const CATEGORIAS_ITENS: CategoriaItem[] = [
  {
    id: 'cesta-basica',
    nome: 'Cesta básica nacional de alimentos',
    descricao: 'Alíquota zero de CBS e IBS para itens da cesta básica nacional.',
    reducaoPercentual: 100,
    exemplos: ['Arroz', 'Feijão', 'Leite', 'Carnes', 'Frutas', 'Pães', 'Café'],
  },
  {
    id: 'isenta100',
    nome: 'Outras reduções de 100% (isenção)',
    descricao:
      'Dispositivos médicos de uso pessoal para PCD, medicamentos específicos (Monofásico/Farmácia Popular), produtos hortícolas in natura, serviços de reabilitação, entre outros previstos em lei.',
    reducaoPercentual: 100,
    exemplos: ['Medicamentos essenciais', 'Órteses e próteses', 'Produtos hortícolas in natura'],
  },
  {
    id: 'reduzida60',
    nome: 'Redução de 60%',
    descricao:
      'Serviços de saúde, educação, dispositivos médicos, produtos de higiene básica, transporte coletivo, insumos agropecuários, produções artísticas/culturais e comunicação institucional, entre outros.',
    reducaoPercentual: 60,
    exemplos: [
      'Serviços de saúde',
      'Planos de saúde',
      'Educação (escolas, cursos)',
      'Transporte público coletivo',
      'Produtos agropecuários in natura',
      'Atividades artísticas e culturais',
    ],
  },
  {
    id: 'reduzida30',
    nome: 'Redução de 30%',
    descricao:
      'Serviços prestados por profissionais liberais sujeitos à fiscalização de conselho profissional (sociedades uniprofissionais), quando cumpridos os requisitos legais.',
    reducaoPercentual: 30,
    exemplos: [
      'Advocacia',
      'Contabilidade',
      'Engenharia e arquitetura',
      'Medicina (pessoa jurídica uniprofissional)',
      'Consultorias técnicas regulamentadas',
    ],
  },
  {
    id: 'padrao',
    nome: 'Alíquota padrão (sem redução)',
    descricao: 'Demais produtos e serviços, sujeitos à alíquota cheia de CBS + IBS.',
    reducaoPercentual: 0,
    exemplos: ['Comércio em geral', 'Indústria em geral', 'Serviços não regulamentados'],
  },
];

export function categoriaPorId(id: string): CategoriaItem | undefined {
  return CATEGORIAS_ITENS.find((c) => c.id === id);
}

/** Classes Tailwind do "pill" de redução, por percentual (reutilizado nas listas de itens e nas consultas de NCM/NBS). */
export function classesReducaoBadge(reducaoPercentual: number): string {
  if (reducaoPercentual === 100) return 'bg-emerald-100 text-emerald-700';
  if (reducaoPercentual === 60) return 'bg-sky-100 text-sky-700';
  if (reducaoPercentual === 30) return 'bg-violet-100 text-violet-700';
  return 'bg-stone-100 text-stone-600';
}

/** Alíquotas de referência do "IVA Dual" (CBS + IBS), estimativa MF nov/2024. */
export const ALIQUOTA_REFERENCIA_CBS = 8.8; // %
export const ALIQUOTA_REFERENCIA_IBS = 17.7; // %
export const ALIQUOTA_REFERENCIA_TOTAL = ALIQUOTA_REFERENCIA_CBS + ALIQUOTA_REFERENCIA_IBS; // ~26.5%

export interface FatorTransicaoAno {
  ano: number;
  /** Alíquota de CBS efetivamente em vigor para fins de apuração (%). */
  aliquotaCbs: number;
  /** Alíquota de IBS efetivamente em vigor para fins de apuração (%). */
  aliquotaIbs: number;
  /** Quanto do PIS/COFINS "legado" já deixou de ser devido (0-100). */
  reducaoPisCofins: number;
  /** Quanto do ICMS/ISS "legado" já deixou de ser devido (0-100). */
  reducaoIcmsIss: number;
  pisCofinsExtinto: boolean;
  icmsIssExtinto: boolean;
  emTeste: boolean;
  descricao: string;
}

/**
 * Cronograma de transição da Reforma Tributária (Emenda Constitucional
 * 132/2023 e LC 214/2025), simplificado para fins de simulação. O ano-teste
 * (2026) tem efeito financeiro líquido nulo, pois os valores de CBS/IBS
 * pagos são integralmente compensáveis com os tributos antigos.
 */
export function cronogramaTransicao(ano: number): FatorTransicaoAno {
  if (ano <= 2025) {
    return {
      ano,
      aliquotaCbs: 0,
      aliquotaIbs: 0,
      reducaoPisCofins: 0,
      reducaoIcmsIss: 0,
      pisCofinsExtinto: false,
      icmsIssExtinto: false,
      emTeste: false,
      descricao: 'Regime tributário atual (pré-reforma): PIS/COFINS, ICMS/ISS integrais.',
    };
  }
  if (ano === 2026) {
    return {
      ano,
      aliquotaCbs: 0,
      aliquotaIbs: 0,
      reducaoPisCofins: 0,
      reducaoIcmsIss: 0,
      pisCofinsExtinto: false,
      icmsIssExtinto: false,
      emTeste: true,
      descricao:
        'Ano-teste: CBS 0,9% + IBS 0,1% cobrados à parte, mas integralmente compensáveis com PIS/COFINS/ICMS/ISS devidos (efeito financeiro líquido nulo).',
    };
  }
  if (ano === 2027 || ano === 2028) {
    return {
      ano,
      aliquotaCbs: ALIQUOTA_REFERENCIA_CBS,
      aliquotaIbs: 0,
      reducaoPisCofins: 100,
      reducaoIcmsIss: 0,
      pisCofinsExtinto: true,
      icmsIssExtinto: false,
      emTeste: false,
      descricao: 'CBS substitui integralmente PIS/COFINS. IBS segue em fase de teste (0,1%, efeito neutro). ICMS/ISS mantidos.',
    };
  }
  if (ano >= 2029 && ano <= 2032) {
    const passos: Record<number, number> = { 2029: 10, 2030: 20, 2031: 30, 2032: 40 };
    const reducao = passos[ano];
    return {
      ano,
      aliquotaCbs: ALIQUOTA_REFERENCIA_CBS,
      aliquotaIbs: (ALIQUOTA_REFERENCIA_IBS * reducao) / 100,
      reducaoPisCofins: 100,
      reducaoIcmsIss: reducao,
      pisCofinsExtinto: true,
      icmsIssExtinto: false,
      emTeste: false,
      descricao: `Transição gradual: ICMS/ISS reduzidos em ${reducao}%, IBS assume a proporção equivalente.`,
    };
  }
  return {
    ano,
    aliquotaCbs: ALIQUOTA_REFERENCIA_CBS,
    aliquotaIbs: ALIQUOTA_REFERENCIA_IBS,
    reducaoPisCofins: 100,
    reducaoIcmsIss: 100,
    pisCofinsExtinto: true,
    icmsIssExtinto: true,
    emTeste: false,
    descricao: 'Sistema pleno: CBS + IBS substituem integralmente PIS/COFINS/ICMS/ISS/IPI (Imposto Seletivo residual à parte).',
  };
}

export function validarMix(mix: MixReceitaItem[]): { total: number; valido: boolean } {
  const total = mix.reduce((acc, m) => acc + (m.percentualReceita || 0), 0);
  return { total, valido: total <= 100.001 };
}

/**
 * Alíquota efetiva de CBS+IBS (%), ponderada pelo mix de receita informado
 * pelo usuário (categorias com redução) e pela alíquota cheia vigente no
 * ano de simulação (soma de CBS + IBS daquele ano da transição).
 */
export function aliquotaEfetivaCbsIbs(mix: MixReceitaItem[], aliquotaCheia: number = ALIQUOTA_REFERENCIA_TOTAL): number {
  const { total } = validarMix(mix);
  const percentualPadrao = Math.max(100 - total, 0);

  let somaPonderada = 0;
  for (const item of mix) {
    const cat = categoriaPorId(item.categoria);
    if (!cat) continue;
    const aliquotaItem = aliquotaCheia * (1 - cat.reducaoPercentual / 100);
    somaPonderada += aliquotaItem * (item.percentualReceita / 100);
  }
  somaPonderada += aliquotaCheia * (percentualPadrao / 100);

  return somaPonderada;
}
