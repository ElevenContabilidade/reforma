import type {
  AtividadeMei,
  CategoriaDespesa,
  CategoriaReceita,
  ClienteMei,
  Lancamento,
  RegistroDas,
} from './types';

/** Salário mínimo de 2026 (Decreto 12.797/2025). Ajustável em Configurações. */
export const SALARIO_MINIMO_PADRAO = 1621;
/** LC 123/2006, art. 18-A, §1º. */
export const LIMITE_ANUAL_PADRAO = 81000;
/** MEI Transportador Autônomo de Cargas (art. 18-F, LC 188/2021). */
export const LIMITE_ANUAL_CAMINHONEIRO = 251600;
/** Excesso de até 20% do limite: desenquadramento só a partir do ano seguinte (art. 18-A, §7º, III). */
export const TOLERANCIA_EXCESSO = 0.2;
/** Valores fixos dentro do DAS-MEI (art. 18-A, §3º, V). */
export const ICMS_FIXO = 1;
export const ISS_FIXO = 5;

export const ATIVIDADES: { value: AtividadeMei; label: string }[] = [
  { value: 'comercio', label: 'Comércio / Indústria (ICMS)' },
  { value: 'servicos', label: 'Serviços (ISS)' },
  { value: 'comercio_servicos', label: 'Comércio e Serviços (ICMS + ISS)' },
  { value: 'caminhoneiro', label: 'MEI Transportador Autônomo de Cargas' },
];

export const CATEGORIAS_RECEITA: { value: CategoriaReceita; label: string }[] = [
  { value: 'revenda', label: 'Revenda de mercadorias' },
  { value: 'industrializacao', label: 'Venda de produtos fabricados' },
  { value: 'servico', label: 'Prestação de serviços' },
];

export const CATEGORIAS_DESPESA: { value: CategoriaDespesa; label: string }[] = [
  { value: 'mercadorias', label: 'Compra de mercadorias / matéria-prima' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'contas_consumo', label: 'Energia, água, internet, telefone' },
  { value: 'das', label: 'Pagamento do DAS' },
  { value: 'funcionario', label: 'Salário e encargos do funcionário' },
  { value: 'material', label: 'Material de uso e consumo' },
  { value: 'servicos_terceiros', label: 'Serviços de terceiros' },
  { value: 'retirada', label: 'Retirada do dono (pró-labore / lucro)' },
  { value: 'outras', label: 'Outras despesas' },
];

export function rotuloCategoria(categoria: string): string {
  return (
    [...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].find((c) => c.value === categoria)?.label ?? categoria
  );
}

export interface ComposicaoDas {
  inss: number;
  icms: number;
  iss: number;
  total: number;
}

export function valorDas(atividade: AtividadeMei, salarioMinimo: number): ComposicaoDas {
  // Caminhoneiro recolhe 12% do salário mínimo de INSS (LC 188/2021); os demais, 5%.
  const inss = round2(salarioMinimo * (atividade === 'caminhoneiro' ? 0.12 : 0.05));
  const icms = atividade === 'servicos' ? 0 : ICMS_FIXO;
  const iss = atividade === 'comercio' || atividade === 'caminhoneiro' ? 0 : ISS_FIXO;
  return { inss, icms, iss, total: round2(inss + icms + iss) };
}

/**
 * Limite do ano-calendário. No ano de abertura é proporcional: limite/12 por mês,
 * contando o mês de abertura inteiro (art. 18-A, §2º).
 */
export function limiteDoAno(
  cliente: Pick<ClienteMei, 'dataAbertura' | 'atividade'>,
  ano: number,
  limiteGeral: number,
): number {
  const limiteAnual = cliente.atividade === 'caminhoneiro' ? LIMITE_ANUAL_CAMINHONEIRO : limiteGeral;
  const [anoAbertura, mesAbertura] = cliente.dataAbertura.split('-').map(Number);
  if (!anoAbertura || anoAbertura < ano) return limiteAnual;
  if (anoAbertura > ano) return 0;
  const meses = 12 - mesAbertura + 1;
  return round2((limiteAnual / 12) * meses);
}

export type FaixaLimite = 'ok' | 'atencao' | 'alerta' | 'excedido' | 'desenquadrado';

export interface SituacaoLimite {
  faixa: FaixaLimite;
  percentual: number;
  saldo: number;
  titulo: string;
  orientacao: string;
}

export function situacaoLimite(receitaAno: number, limite: number): SituacaoLimite {
  const percentual = limite > 0 ? (receitaAno / limite) * 100 : 0;
  const saldo = round2(limite - receitaAno);

  if (receitaAno > limite * (1 + TOLERANCIA_EXCESSO)) {
    return {
      faixa: 'desenquadrado',
      percentual,
      saldo,
      titulo: 'Excesso acima de 20%',
      orientacao:
        'Desenquadramento retroativo a 1º de janeiro (ou à data de abertura). Comunicar no Portal do Simples, recalcular o ano pelo Simples Nacional e recolher as diferenças.',
    };
  }
  if (receitaAno > limite) {
    return {
      faixa: 'excedido',
      percentual,
      saldo,
      titulo: 'Limite ultrapassado (até 20%)',
      orientacao:
        'Recolher o DAS complementar sobre o excesso na DASN-SIMEI e comunicar o desenquadramento, com efeitos a partir de 1º de janeiro do ano seguinte.',
    };
  }
  if (percentual >= 90) {
    return {
      faixa: 'alerta',
      percentual,
      saldo,
      titulo: 'Muito perto do limite',
      orientacao: 'Planejar agora a migração para ME no Simples Nacional e segurar o faturamento até dezembro.',
    };
  }
  if (percentual >= 70) {
    return {
      faixa: 'atencao',
      percentual,
      saldo,
      titulo: 'Atenção ao limite',
      orientacao: 'Acompanhar o faturamento mês a mês e simular a projeção até dezembro.',
    };
  }
  return {
    faixa: 'ok',
    percentual,
    saldo,
    titulo: 'Dentro do limite',
    orientacao: 'Faturamento compatível com o MEI.',
  };
}

/** DAS vence no dia 20 do mês seguinte; caindo em fim de semana, vai para o próximo dia útil. */
export function vencimentoDas(competencia: string): Date {
  const [ano, mes] = competencia.split('-').map(Number);
  return proximoDiaUtil(new Date(ano, mes, 20));
}

/** DASN-SIMEI: até 31 de maio do ano seguinte (Res. CGSN 140/2018, art. 109). */
export function vencimentoDasn(anoBase: number): Date {
  return new Date(anoBase + 1, 4, 31);
}

function proximoDiaUtil(data: Date): Date {
  const d = new Date(data);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

export function competencia(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

export function rotuloCompetencia(comp: string): string {
  const [ano, mes] = comp.split('-').map(Number);
  return `${MESES_ABREV[mes - 1]}/${ano}`;
}

export const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Os últimos `quantidade` meses (do atual para trás), para seletores de competência. */
export function opcoesDeMes(quantidade: number, hoje = new Date()): { value: string; label: string }[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return { value: competencia(d), label: `${MESES[d.getMonth()]} de ${d.getFullYear()}` };
  });
}

/** Competências do ano em que o MEI já existia, até o mês de referência (inclusive). */
export function competenciasDoAno(cliente: Pick<ClienteMei, 'dataAbertura'>, ano: number, ate: Date): string[] {
  const inicio = cliente.dataAbertura.slice(0, 7);
  const fim = competencia(ate);
  const lista: string[] = [];
  for (let mes = 1; mes <= 12; mes++) {
    const comp = `${ano}-${String(mes).padStart(2, '0')}`;
    if (comp >= inicio && comp <= fim) lista.push(comp);
  }
  return lista;
}

export type StatusDas = 'pago' | 'a_vencer' | 'vencido';

export function statusDas(registro: RegistroDas | undefined, comp: string, hoje: Date): StatusDas {
  if (registro?.pago) return 'pago';
  const venc = vencimentoDas(comp);
  return fimDoDia(venc) < hoje ? 'vencido' : 'a_vencer';
}

function fimDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
}

export function receitaNoPeriodo(lancamentos: Lancamento[], clienteId: string, prefixo: string): number {
  return round2(
    lancamentos
      .filter((l) => l.clienteId === clienteId && l.tipo === 'receita' && l.data.startsWith(prefixo))
      .reduce((s, l) => s + l.valor, 0),
  );
}

export function despesaNoPeriodo(lancamentos: Lancamento[], clienteId: string, prefixo: string): number {
  return round2(
    lancamentos
      .filter((l) => l.clienteId === clienteId && l.tipo === 'despesa' && l.data.startsWith(prefixo))
      .reduce((s, l) => s + l.valor, 0),
  );
}

/**
 * Projeção linear até dezembro com base na média dos meses já decorridos
 * (desde a abertura, se ela ocorreu no próprio ano).
 */
export function projecaoAnual(
  receitaAno: number,
  cliente: Pick<ClienteMei, 'dataAbertura'>,
  ano: number,
  hoje: Date,
): number {
  const decorridos = competenciasDoAno(cliente, ano, hoje).length;
  if (decorridos === 0) return 0;
  const [anoAbertura, mesAbertura] = cliente.dataAbertura.split('-').map(Number);
  const mesesAtivosNoAno = anoAbertura === ano ? 12 - mesAbertura + 1 : 12;
  if (ano < hoje.getFullYear()) return receitaAno;
  return round2((receitaAno / decorridos) * mesesAtivosNoAno);
}

export interface LinhaRelatorio {
  comNota: number;
  semNota: number;
  total: number;
}

export interface RelatorioMensal {
  revenda: LinhaRelatorio;
  industrializacao: LinhaRelatorio;
  servico: LinhaRelatorio;
  total: number;
}

export function relatorioMensal(lancamentos: Lancamento[], clienteId: string, comp: string): RelatorioMensal {
  const vazio = (): LinhaRelatorio => ({ comNota: 0, semNota: 0, total: 0 });
  const rel: RelatorioMensal = { revenda: vazio(), industrializacao: vazio(), servico: vazio(), total: 0 };
  for (const l of lancamentos) {
    if (l.clienteId !== clienteId || l.tipo !== 'receita' || !l.data.startsWith(comp)) continue;
    const linha = rel[l.categoria as CategoriaReceita];
    if (!linha) continue;
    if (l.comNota) linha.comNota += l.valor;
    else linha.semNota += l.valor;
    linha.total += l.valor;
    rel.total += l.valor;
  }
  return rel;
}

/** Receitas para PJ sem nota: a emissão é obrigatória (Res. CGSN 140/2018, art. 106). */
export function receitasPjSemNota(lancamentos: Lancamento[], clienteId: string, prefixo: string): Lancamento[] {
  return lancamentos.filter(
    (l) => l.clienteId === clienteId && l.tipo === 'receita' && l.tomadorPj && !l.comNota && l.data.startsWith(prefixo),
  );
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(`${data}T12:00:00`) : data;
  return d.toLocaleDateString('pt-BR');
}

export function hojeIso(): string {
  const d = new Date();
  return `${competencia(d)}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatarCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
