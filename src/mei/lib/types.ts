export type Perfil = 'escritorio' | 'cliente';

/** Define a composição do DAS-MEI (ICMS e/ou ISS fixos + INSS). */
export type AtividadeMei = 'comercio' | 'servicos' | 'comercio_servicos' | 'caminhoneiro';

/** Linhas do Relatório Mensal de Receitas Brutas (Res. CGSN 140/2018, Anexo X). */
export type CategoriaReceita = 'revenda' | 'industrializacao' | 'servico';

export type CategoriaDespesa =
  | 'mercadorias'
  | 'aluguel'
  | 'contas_consumo'
  | 'das'
  | 'funcionario'
  | 'material'
  | 'servicos_terceiros'
  | 'retirada'
  | 'outras';

export interface ClienteMei {
  id: string;
  nome: string;
  nomeFantasia: string;
  cnpj: string;
  atividade: AtividadeMei;
  descricaoAtividade: string;
  /** YYYY-MM-DD */
  dataAbertura: string;
  temFuncionario: boolean;
  whatsapp: string;
  email: string;
  /** Código que o cliente usa, junto com o CNPJ, para entrar na área dele. */
  codigoAcesso: string;
  ativo: boolean;
  observacoes: string;
  criadoEm: string;
}

export interface Lancamento {
  id: string;
  clienteId: string;
  tipo: 'receita' | 'despesa';
  /** YYYY-MM-DD */
  data: string;
  descricao: string;
  valor: number;
  categoria: CategoriaReceita | CategoriaDespesa;
  comNota: boolean;
  /** Receita para cliente com CNPJ: a emissão de nota é obrigatória. */
  tomadorPj: boolean;
  origem: Perfil;
  criadoEm: string;
}

export interface RegistroDas {
  clienteId: string;
  /** YYYY-MM */
  competencia: string;
  pago: boolean;
  pagoEm?: string;
  informadoPor: Perfil;
}

export interface RegistroDasn {
  clienteId: string;
  anoBase: number;
  entregue: boolean;
  entregueEm?: string;
}

export type AssuntoMensagem =
  | 'emitir_nota'
  | 'segunda_via_das'
  | 'parcelamento'
  | 'contratar_funcionario'
  | 'duvida'
  | 'aviso';

export interface Mensagem {
  id: string;
  clienteId: string;
  de: Perfil;
  assunto: AssuntoMensagem;
  texto: string;
  criadoEm: string;
  lida: boolean;
  resolvida: boolean;
}

export interface ConfigMei {
  nomeEscritorio: string;
  whatsappEscritorio: string;
  salarioMinimo: number;
  limiteAnual: number;
}

export interface BaseMei {
  versao: 1;
  config: ConfigMei;
  clientes: ClienteMei[];
  lancamentos: Lancamento[];
  das: RegistroDas[];
  dasn: RegistroDasn[];
  mensagens: Mensagem[];
}

export type Sessao = { perfil: 'escritorio' } | { perfil: 'cliente'; clienteId: string };
