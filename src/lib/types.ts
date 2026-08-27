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
  rbt12?: number;
  faturamentoMensal?: number;
  folhaPagamento12m?: number;
  anexo?: AnexoSimples;
  valorDas?: number;
  competencia?: string;
  textoDetectado: boolean;
}
