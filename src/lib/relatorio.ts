import type { AnexoSimples, ApuracaoPgdas, CarteiraEmpresa, ReceitaMensal, SituacaoFiscal, StatusPagamento } from './types';
import { chaveCompetencia } from './apuracaoPgdas';
import { encontrarFaixa, LIMITE_SIMPLES_NACIONAL, TABELAS_SIMPLES } from './simplesTables';

const CHAVE = 'reforma-tributaria:carteira';
export const SUBLIMITE_ICMS_ISS = 3_600_000;

// ---------- Armazenamento (localStorage, por CNPJ) ----------

export function listarCarteira(): CarteiraEmpresa[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? (JSON.parse(raw) as CarteiraEmpresa[]) : [];
  } catch {
    return [];
  }
}

function gravarCarteira(lista: CarteiraEmpresa[]): CarteiraEmpresa[] {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // Sem storage (aba anônima etc.): segue só em memória.
  }
  return lista;
}

/** CNPJ básico (8 dígitos): matriz e filiais ficam na mesma empresa. */
export function raizCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '').slice(0, 8);
}

function ordenar(apuracoes: ApuracaoPgdas[]): ApuracaoPgdas[] {
  return [...apuracoes].sort((a, b) => chaveCompetencia(a.competencia).localeCompare(chaveCompetencia(b.competencia)));
}

/**
 * Inclui as declarações lidas na carteira. Uma competência já existente é
 * substituída (retificação), mas o status de pagamento já marcado é mantido.
 */
export function incluirApuracoes(lista: CarteiraEmpresa[], novas: ApuracaoPgdas[]): CarteiraEmpresa[] {
  const resultado = lista.map((e) => ({ ...e, apuracoes: [...e.apuracoes] }));
  for (const nova of novas) {
    const raiz = raizCnpj(nova.cnpj);
    let empresa = resultado.find((e) => raizCnpj(e.cnpj) === raiz);
    if (!empresa) {
      empresa = { cnpj: nova.cnpj, razaoSocial: nova.razaoSocial, apuracoes: [] };
      resultado.push(empresa);
    }
    if (nova.razaoSocial) empresa.razaoSocial = nova.razaoSocial;
    const existente = empresa.apuracoes.find((a) => a.competencia === nova.competencia);
    // Pagamento lido do extrato prevalece; sem ele, mantém o que já foi marcado à mão.
    const mesclada: ApuracaoPgdas =
      existente && !nova.dataPagamento
        ? { ...nova, status: existente.status, dataPagamento: existente.dataPagamento, valorPago: existente.valorPago }
        : nova;
    empresa.apuracoes = ordenar([...empresa.apuracoes.filter((a) => a.competencia !== nova.competencia), mesclada]);
  }
  return gravarCarteira(resultado);
}

/** Guarda o Relatório de Situação Fiscal mais recente da empresa (substitui o anterior). */
export function incluirSituacaoFiscal(lista: CarteiraEmpresa[], sf: SituacaoFiscal): CarteiraEmpresa[] {
  const raiz = raizCnpj(sf.cnpj);
  const existe = lista.some((e) => raizCnpj(e.cnpj) === raiz);
  const resultado = existe
    ? lista.map((e) =>
        raizCnpj(e.cnpj) === raiz ? { ...e, razaoSocial: e.razaoSocial || sf.razaoSocial, situacaoFiscal: sf } : e,
      )
    : [...lista, { cnpj: sf.cnpj, razaoSocial: sf.razaoSocial, apuracoes: [], situacaoFiscal: sf }];
  return gravarCarteira(resultado);
}

export function atualizarEmpresa(lista: CarteiraEmpresa[], cnpj: string, mudancas: Partial<CarteiraEmpresa>): CarteiraEmpresa[] {
  return gravarCarteira(lista.map((e) => (e.cnpj === cnpj ? { ...e, ...mudancas } : e)));
}

export function atualizarApuracao(
  lista: CarteiraEmpresa[],
  cnpj: string,
  competencia: string,
  mudancas: Partial<ApuracaoPgdas>,
): CarteiraEmpresa[] {
  return gravarCarteira(
    lista.map((e) =>
      e.cnpj === cnpj
        ? { ...e, apuracoes: e.apuracoes.map((a) => (a.competencia === competencia ? { ...a, ...mudancas } : a)) }
        : e,
    ),
  );
}

export function removerApuracao(lista: CarteiraEmpresa[], cnpj: string, competencia: string): CarteiraEmpresa[] {
  return gravarCarteira(
    lista
      .map((e) => (e.cnpj === cnpj ? { ...e, apuracoes: e.apuracoes.filter((a) => a.competencia !== competencia) } : e))
      .filter((e) => e.apuracoes.length > 0 || e.situacaoFiscal),
  );
}

// ---------- Datas e vencimento ----------

/**
 * Vencimento do DAS: dia 20 do mês seguinte ao PA (LC 123/2006, art. 21, III).
 * Caindo em sábado/domingo, passa para o próximo dia útil (Res. CGSN 140/2018,
 * art. 40). Feriados nacionais não são considerados.
 */
export function vencimentoDas(competencia: string): Date {
  const [mes, ano] = competencia.split('/').map(Number);
  const data = new Date(ano, mes, 20); // mês 0-based: "mes" já é o mês seguinte
  while (data.getDay() === 0 || data.getDay() === 6) data.setDate(data.getDate() + 1);
  return data;
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR');
}

export function isoParaBr(iso?: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function nomeMes(competencia: string, curto = true): string {
  const [mes, ano] = competencia.split('/').map(Number);
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: curto ? 'short' : 'long' }).replace('.', '');
  return curto ? `${nome}/${String(ano).slice(2)}` : `${nome} de ${ano}`;
}

export type SituacaoDas = 'pago' | 'parcelado' | 'a-vencer' | 'aberto' | 'nao-confirmado';

export const ROTULO_SITUACAO: Record<SituacaoDas, string> = {
  pago: 'Pago',
  parcelado: 'Parcelado',
  'a-vencer': 'A vencer',
  aberto: 'Em aberto',
  'nao-confirmado': 'Não confirmado',
};

export const ROTULO_STATUS: Record<StatusPagamento, string> = {
  'nao-informado': 'Não informado',
  pago: 'Pago',
  aberto: 'Em aberto',
  parcelado: 'Parcelado',
};

/** Situação exibida ao cliente, combinando o status marcado com o vencimento. */
export function situacaoDas(apuracao: ApuracaoPgdas, devedoras?: Set<string>, hoje = new Date()): SituacaoDas {
  // O Relatório de Situação Fiscal da Receita prevalece sobre a marcação manual.
  if (devedoras?.has(apuracao.competencia)) return 'aberto';
  if (apuracao.valorDas <= 0 || apuracao.status === 'pago') return 'pago';
  if (apuracao.status === 'parcelado') return 'parcelado';
  const vencido = vencimentoDas(apuracao.competencia) < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (!vencido) return 'a-vencer';
  return apuracao.status === 'aberto' ? 'aberto' : 'nao-confirmado';
}

// ---------- Indicadores ----------

/**
 * Série de faturamento mensal: receitas anteriores informadas nas declarações
 * + a receita do próprio PA de cada declaração (a mais recente prevalece).
 */
export function serieFaturamento(apuracoes: ApuracaoPgdas[]): ReceitaMensal[] {
  const mapa = new Map<string, number>();
  for (const a of ordenar(apuracoes)) {
    for (const r of a.receitasAnteriores) mapa.set(r.competencia, r.valor);
  }
  for (const a of apuracoes) mapa.set(a.competencia, a.receitaPA);
  return [...mapa.entries()]
    .map(([competencia, valor]) => ({ competencia, valor }))
    .sort((a, b) => chaveCompetencia(a.competencia).localeCompare(chaveCompetencia(b.competencia)));
}

function competenciaAnterior(competencia: string, meses: number): string {
  const [mes, ano] = competencia.split('/').map(Number);
  const d = new Date(ano, mes - 1 - meses, 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** RBT12 de cada mês com 12 meses anteriores conhecidos (soma dos 12 meses anteriores ao PA). */
export function serieRbt12(serie: ReceitaMensal[]): ReceitaMensal[] {
  const mapa = new Map(serie.map((r) => [r.competencia, r.valor]));
  const resultado: ReceitaMensal[] = [];
  for (const { competencia } of serie) {
    let soma = 0;
    let completo = true;
    for (let i = 1; i <= 12; i++) {
      const v = mapa.get(competenciaAnterior(competencia, i));
      if (v === undefined) {
        completo = false;
        break;
      }
      soma += v;
    }
    if (completo) resultado.push({ competencia, valor: soma });
  }
  return resultado;
}

/** RBT12 projetada para o mês seguinte: entra o PA atual, sai o mês mais antigo. */
export function rbt12ProximoMes(serie: ReceitaMensal[], competencia: string): number | undefined {
  const mapa = new Map(serie.map((r) => [r.competencia, r.valor]));
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    const v = mapa.get(competenciaAnterior(competencia, i));
    if (v === undefined) return undefined;
    soma += v;
  }
  return soma;
}

export interface InfoFaixa {
  anexo: AnexoSimples;
  numero: number; // 1 a 6
  aliquotaNominal: number;
  limite: number;
  limiteAnterior: number;
  faltaParaProxima: number;
  aliquotaNominalProxima?: number;
}

export function infoFaixa(anexo: AnexoSimples, rbt12: number): InfoFaixa {
  const tabela = TABELAS_SIMPLES[anexo];
  const faixa = encontrarFaixa(anexo, rbt12);
  const idx = tabela.indexOf(faixa);
  return {
    anexo,
    numero: idx + 1,
    aliquotaNominal: faixa.aliquotaNominal,
    limite: faixa.ate,
    limiteAnterior: idx > 0 ? tabela[idx - 1].ate : 0,
    faltaParaProxima: Math.max(faixa.ate - rbt12, 0),
    aliquotaNominalProxima: tabela[idx + 1]?.aliquotaNominal,
  };
}

export { LIMITE_SIMPLES_NACIONAL };
