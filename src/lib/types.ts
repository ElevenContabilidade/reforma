// Tipos centrais do simulador de regime tributário / reforma tributária.

export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export type SetorAtividade = 'comercio' | 'industria' | 'servicos';

/** Categorias de redução de alíquota da CBS/IBS (Lei Complementar 214/2025). */
export type CategoriaReducao = 'padrao' | 'reduzida60' | 'reduzida30' | 'isenta100' | 'cesta-basica';

export interface CategoriaItem {
  id: CategoriaReducao;
  nome: string;
  descricao: string;
  reducaoPercentual: number; // 0, 30, 60 ou 100
  exemplos: string[];
}

/** Percentual de receita da empresa alocado a cada categoria de item/serviço. */
export interface MixReceitaItem {
  categoria: CategoriaReducao;
  percentualReceita: number; // 0-100
}

export interface DadosEmpresa {
  nomeCliente: string;
  cnpj: string;
  setor: SetorAtividade;
  anexoSimples: AnexoSimples;
  atividadeSujeitaFatorR: boolean;

  // Financeiro (valores mensais, em R$)
  faturamentoMensal: number;
  rbt12: number; // receita bruta acumulada 12 meses
  folhaPagamento12m: number; // folha + pró-labore + encargos, 12 meses (para Fator R)

  // Presunção / Lucro Real
  margemLucroReal: number; // % estimada de lucro sobre a receita (Lucro Real)
  percentualCompraInsumos: number; // % da receita gasta em compras/insumos com direito a crédito

  // Tributos indiretos "legados" informados pelo contador (efetivos, líquidos de créditos)
  aliquotaEfetivaIcmsIss: number; // % sobre a receita

  anoSimulacao: number; // 2026-2033, define o cronograma de transição

  mixReceita: MixReceitaItem[];
}

export interface LinhaTributo {
  tributo: string;
  valorMensal: number;
  valorAnual: number;
  descricao?: string;
}

export interface ResultadoRegime {
  regime: 'simples' | 'simples-hibrido' | 'presumido' | 'real';
  nomeExibicao: string;
  linhas: LinhaTributo[];
  totalMensal: number;
  totalAnual: number;
  aliquotaEfetivaTotal: number; // % sobre faturamento
  observacoes: string[];
}

export interface SimulacaoSalva {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
  dados: DadosEmpresa;
}

export interface DadosExtraidosPgdas {
  cnpj?: string;
  razaoSocial?: string;
  rbt12?: number;
  faturamentoMensal?: number;
  folhaPagamento12m?: number;
  anexo?: AnexoSimples;
  valorDas?: number;
  competencia?: string;
  textoDetectado: boolean;
}

// ---- Relatório mensal do cliente (apuração do Simples Nacional via PGDAS-D) ----

export const TRIBUTOS_DAS = ['IRPJ', 'CSLL', 'COFINS', 'PIS/Pasep', 'INSS/CPP', 'ICMS', 'IPI', 'ISS'] as const;
export type TributoDas = (typeof TRIBUTOS_DAS)[number];

export type StatusPagamento = 'pago' | 'aberto' | 'parcelado' | 'nao-informado';

export interface ReceitaMensal {
  competencia: string; // MM/AAAA
  valor: number;
}

/** Uma declaração do PGDAS-D (uma competência) já interpretada. */
export interface ApuracaoPgdas {
  competencia: string; // MM/AAAA
  cnpj: string;
  razaoSocial: string;
  municipio?: string;
  uf?: string;
  anexos: AnexoSimples[];
  receitaPA: number;
  rbt12: number;
  rba?: number;
  rbaa?: number;
  valorDas: number;
  tributos: Partial<Record<TributoDas, number>>;
  receitasAnteriores: ReceitaMensal[];
  fatorR?: string;
  numeroDeclaracao?: string;
  retificadora: boolean;
  dataTransmissao?: string; // DD/MM/AAAA
  status: StatusPagamento;
  dataPagamento?: string; // AAAA-MM-DD
  valorPago?: number; // soma dos pagamentos lidos do extrato do PGDAS-D
}

/** Histórico de apurações de uma empresa, agrupado pelo CNPJ. */
export interface CarteiraEmpresa {
  cnpj: string;
  razaoSocial: string;
  telefoneWhatsapp?: string;
  observacoes?: string;
  apuracoes: ApuracaoPgdas[];
  situacaoFiscal?: SituacaoFiscal;
  guias?: GuiaMensal[];
}

/** Débito listado no Relatório de Situação Fiscal (e-CAC). */
export interface PendenciaFiscal {
  origem: 'receita' | 'pgfn';
  receita: string; // ex.: "SIMPLES NAC."
  competencia?: string; // PA no formato MM/AAAA (ou exercício)
  vencimento?: string; // AAAA-MM-DD
  valorOriginal?: number;
  saldoDevedor?: number;
  multa?: number;
  juros?: number;
  total?: number; // saldo devedor consolidado
  situacao: string;
  inscricao?: string; // nº da inscrição em dívida ativa
}

export interface SituacaoFiscal {
  cnpj: string;
  razaoSocial: string;
  dataReferencia: string; // AAAA-MM-DD (emissão do relatório ou data da leitura)
  pendencias: PendenciaFiscal[];
  parcelamentos?: ParcelamentoFiscal[];
}

/** Guia mensal fora do DAS: DARF da DCTFWeb (INSS/IRRF) ou guia do FGTS Digital. */
export interface GuiaMensal {
  id: string; // nº do documento / identificador da guia
  tipo: 'dctfweb' | 'fgts' | 'parcelamento';
  cnpj: string;
  razaoSocial: string;
  descricao: string; // ex.: "INSS - empregados e pró-labore"
  competencia: string; // MM/AAAA
  vencimento: string; // AAAA-MM-DD
  valor: number;
  composicao: { codigo: string; denominacao: string; valor: number }[];
  trabalhadores?: number;
  status: StatusPagamento;
  dataPagamento?: string; // AAAA-MM-DD
}

/** Parcelamento informado no Relatório de Situação Fiscal (sem valores de parcela). */
export interface ParcelamentoFiscal {
  sistema: string; // ex.: "PARCSN/PARCMEI"
  descricao: string; // ex.: "SIMPLES NACIONAL - EM PARCELAMENTO"
  orgao: 'receita' | 'pgfn';
}
