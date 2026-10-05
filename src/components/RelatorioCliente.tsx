import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, CircleCheck, Copy, FileUp, Loader2, MessageCircle, Printer, Trash2 } from 'lucide-react';
import type { ApuracaoPgdas, CarteiraEmpresa, StatusPagamento } from '../lib/types';
import { TRIBUTOS_DAS } from '../lib/types';
import { lerTextoPdf } from '../lib/pgdasParser';
import { interpretarDeclaracao, chaveCompetencia } from '../lib/apuracaoPgdas';
import {
  atualizarApuracao,
  atualizarEmpresa,
  formatarData,
  incluirApuracoes,
  isoParaBr,
  listarCarteira,
  nomeMes,
  raizCnpj,
  removerApuracao,
  ROTULO_SITUACAO,
  ROTULO_STATUS,
  serieFaturamento,
  situacaoDas,
  SUBLIMITE_ICMS_ISS,
  vencimentoDas,
  type SituacaoDas,
} from '../lib/relatorio';
import { formatarMoeda, formatarPercentual } from '../lib/format';
import { imprimirAreaImpressao } from '../lib/imprimir';
import { EleveIcon } from './EleveLogo';

// Paleta Eleven (bordô + dourado) para os gráficos.
const BRAND = '#6b1013';
const GOLD = '#c9922b';
const GRADE = '#e7e5e4';
const TEXTO_EIXO = '#78716c';
const CORES_TRIBUTOS = ['#290608', '#6b1013', '#8c2426', '#b3494b', '#d17f80', '#c9922b', '#e0ad42', '#eeca6d'];

const ESTILO_SITUACAO: Record<SituacaoDas, string> = {
  pago: 'bg-emerald-100 text-emerald-800',
  parcelado: 'bg-sky-100 text-sky-800',
  'a-vencer': 'bg-gold-100 text-brand-800',
  aberto: 'bg-rose-100 text-rose-800',
  'nao-confirmado': 'bg-stone-200 text-stone-700',
};

/** Rótulo curto para eixos de gráfico (sem "R$" para não quebrar linha). */
function eixoMoeda(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (v >= 1_000) return `${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function Kpi({ rotulo, valor, detalhe, destaque }: { rotulo: string; valor: string; detalhe?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${destaque ? 'border-brand-700 bg-brand-700 text-white' : 'border-stone-200 bg-white'}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${destaque ? 'text-gold-200' : 'text-stone-500'}`}>{rotulo}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums impresso:text-base ${destaque ? 'text-white' : 'text-stone-900'}`}>{valor}</p>
      {detalhe && <p className={`mt-0.5 text-xs ${destaque ? 'text-brand-100' : 'text-stone-500'}`}>{detalhe}</p>}
    </div>
  );
}

function Secao({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`print-avoid-break rounded-xl border border-stone-200 bg-white p-5 impresso:p-3 ${className ?? ''}`}>
      <h3 className="mb-3 impresso:mb-2 border-l-4 border-gold-400 pl-2 text-sm font-semibold uppercase tracking-wide text-brand-800">{titulo}</h3>
      {children}
    </section>
  );
}

export function RelatorioCliente({ cnpjSugerido }: { cnpjSugerido?: string }) {
  const [carteira, setCarteira] = useState<CarteiraEmpresa[]>(() => listarCarteira());
  const [cnpjSel, setCnpjSel] = useState<string | null>(() => {
    const lista = listarCarteira();
    const sugerida = cnpjSugerido ? lista.find((e) => raizCnpj(e.cnpj) === raizCnpj(cnpjSugerido)) : undefined;
    return (sugerida ?? lista[0])?.cnpj ?? null;
  });
  const [compSel, setCompSel] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const empresa = carteira.find((e) => e.cnpj === cnpjSel) ?? carteira[0];
  const apuracoes = useMemo(() => empresa?.apuracoes ?? [], [empresa]);
  const atual = apuracoes.find((a) => a.competencia === compSel) ?? apuracoes[apuracoes.length - 1];

  async function processarArquivos(arquivos: FileList | null | undefined) {
    if (!arquivos || arquivos.length === 0) return;
    setCarregando(true);
    setAvisos([]);
    const lidas: ApuracaoPgdas[] = [];
    const problemas: string[] = [];
    for (const arquivo of Array.from(arquivos)) {
      if (arquivo.type !== 'application/pdf') {
        problemas.push(`${arquivo.name}: envie o PDF da declaração do PGDAS-D.`);
        continue;
      }
      try {
        const declaracao = interpretarDeclaracao(await lerTextoPdf(arquivo));
        if (declaracao) lidas.push(declaracao);
        else problemas.push(`${arquivo.name}: não parece ser a declaração completa do PGDAS-D (faltam competência ou receita do PA).`);
      } catch (e) {
        console.error(e);
        problemas.push(`${arquivo.name}: falha ao ler o PDF (corrompido ou protegido por senha?).`);
      }
    }
    if (lidas.length > 0) {
      const nova = incluirApuracoes(carteira, lidas);
      setCarteira(nova);
      const ultima = lidas.reduce((a, b) => (chaveCompetencia(b.competencia) > chaveCompetencia(a.competencia) ? b : a));
      setCnpjSel(nova.find((e) => raizCnpj(e.cnpj) === raizCnpj(ultima.cnpj))?.cnpj ?? null);
      setCompSel(ultima.competencia);
    }
    setAvisos(problemas);
    setCarregando(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  const indicadores = useMemo(() => {
    if (!atual) return null;
    const ateAtual = (c: string) => chaveCompetencia(c) <= chaveCompetencia(atual.competencia);
    const serie = serieFaturamento(apuracoes).filter((r) => ateAtual(r.competencia));
    const ultimos13 = serie.slice(-13);
    const mediaFaturamento = ultimos13.length > 1 ? ultimos13.slice(0, -1).reduce((s, r) => s + r.valor, 0) / (ultimos13.length - 1) : 0;
    const ultimos12 = serie.slice(-12);
    const anteriores = apuracoes.filter((a) => ateAtual(a.competencia));
    const aliquota = atual.receitaPA > 0 ? (atual.valorDas / atual.receitaPA) * 100 : 0;
    const anterior = anteriores[anteriores.length - 2];
    const aliquotaAnterior = anterior && anterior.receitaPA > 0 ? (anterior.valorDas / anterior.receitaPA) * 100 : undefined;
    const pendentes = anteriores.filter((a) => {
      const s = situacaoDas(a);
      return s === 'aberto' || s === 'nao-confirmado';
    });
    return { serie, ultimos13, mediaFaturamento, ultimos12, anteriores, aliquota, aliquotaAnterior, pendentes };
  }, [apuracoes, atual]);

  function alterarStatus(competencia: string, status: StatusPagamento) {
    if (!empresa) return;
    setCarteira(atualizarApuracao(carteira, empresa.cnpj, competencia, { status }));
  }

  function alterarDataPagamento(competencia: string, dataPagamento: string) {
    if (!empresa) return;
    setCarteira(atualizarApuracao(carteira, empresa.cnpj, competencia, dataPagamento ? { dataPagamento, status: 'pago' } : { dataPagamento: undefined }));
  }

  function excluirCompetencia(competencia: string) {
    if (!empresa) return;
    const nova = removerApuracao(carteira, empresa.cnpj, competencia);
    setCarteira(nova);
    if (compSel === competencia) setCompSel(null);
    if (!nova.some((e) => e.cnpj === empresa.cnpj)) setCnpjSel(nova[0]?.cnpj ?? null);
  }

  function textoResumo(): string {
    if (!atual || !indicadores || !empresa) return '';
    const { pendentes, aliquota } = indicadores;
    const totalPendente = pendentes.reduce((s, a) => s + a.valorDas, 0);
    const situacao =
      pendentes.length === 0
        ? 'em dia'
        : `${pendentes.length} guia(s) sem pagamento confirmado, total de ${formatarMoeda(totalPendente)} (${pendentes.map((a) => a.competencia).join(', ')})`;
    return [
      `Olá! Segue o resumo fiscal da *${empresa.razaoSocial}* - competência ${atual.competencia}:`,
      '',
      `- Faturamento do mês: ${formatarMoeda(atual.receitaPA)}`,
      `- Imposto do Simples (DAS): ${formatarMoeda(atual.valorDas)} - vence em ${formatarData(vencimentoDas(atual.competencia))}`,
      `- Percentual de imposto: ${formatarPercentual(aliquota)} do faturamento`,
      `- Faturamento dos últimos 12 meses (RBT12): ${formatarMoeda(atual.rbt12)}`,
      `- Impostos anteriores: ${situacao}`,
      '',
      'O relatório completo segue em PDF. Qualquer dúvida, estou à disposição.',
      'Eleven Contabilidade & Consultoria',
    ].join('\n');
  }

  // Link real (e não window.open), pois o visualizador de Artifacts bloqueia
  // window.open para boa parte dos usuários.
  function linkWhatsapp(): string {
    const digitos = (empresa?.telefoneWhatsapp ?? '').replace(/\D/g, '');
    const numero = digitos.length >= 10 && !digitos.startsWith('55') ? `55${digitos}` : digitos;
    return `https://wa.me/${numero}?text=${encodeURIComponent(textoResumo())}`;
  }

  async function copiarResumo() {
    try {
      await navigator.clipboard.writeText(textoResumo());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setAvisos(['Não foi possível copiar automaticamente. Use o botão do WhatsApp.']);
    }
  }

  const painel = (
    <div className="no-print space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Relatório mensal do cliente</h2>
        <p className="text-sm text-stone-500">
          Envie um ou mais PDFs da declaração ou do extrato do PGDAS-D (um por competência). Pelo extrato, a data e o valor
          pagos do DAS são preenchidos automaticamente. Quanto mais meses enviar, mais completo fica o
          histórico de impostos. Os dados ficam salvos neste navegador, separados por CNPJ.
        </p>
      </div>

      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-center transition ${
          arrastando ? 'border-brand-500 bg-brand-50' : 'border-stone-300 bg-stone-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          processarArquivos(e.dataTransfer.files);
        }}
      >
        {carregando ? <Loader2 className="h-7 w-7 animate-spin text-brand-600" /> : <FileUp className="h-7 w-7 text-stone-400" />}
        <p className="text-sm font-medium text-stone-700">Arraste os PDFs do PGDAS-D aqui</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          Selecionar arquivos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => processarArquivos(e.target.files)}
        />
      </div>

      {avisos.length > 0 && (
        <div className="space-y-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {avisos.map((a) => (
            <p key={a} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {a}
            </p>
          ))}
        </div>
      )}

      {empresa && atual && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Empresa</span>
              <select
                className="rounded-lg border border-stone-300 bg-white px-3 py-2"
                value={empresa.cnpj}
                onChange={(e) => {
                  setCnpjSel(e.target.value);
                  setCompSel(null);
                }}
              >
                {carteira.map((e) => (
                  <option key={e.cnpj} value={e.cnpj}>
                    {e.razaoSocial || e.cnpj}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Competência do relatório</span>
              <select
                className="rounded-lg border border-stone-300 bg-white px-3 py-2"
                value={atual.competencia}
                onChange={(e) => setCompSel(e.target.value)}
              >
                {[...apuracoes].reverse().map((a) => (
                  <option key={a.competencia} value={a.competencia}>
                    {a.competencia}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">WhatsApp do cliente</span>
              <input
                type="tel"
                className="rounded-lg border border-stone-300 bg-white px-3 py-2"
                placeholder="(85) 99999-9999"
                value={empresa.telefoneWhatsapp ?? ''}
                onChange={(e) => setCarteira(atualizarEmpresa(carteira, empresa.cnpj, { telefoneWhatsapp: e.target.value }))}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => imprimirAreaImpressao(`Relatório ${atual.competencia} - ${empresa.razaoSocial}`, { umaPagina: true })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-800"
            >
              <Printer className="h-4 w-4" />
              Imprimir / salvar PDF
            </button>
            <a
              href={linkWhatsapp()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar resumo no WhatsApp
            </a>
            <button
              onClick={copiarResumo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              {copiado ? <CircleCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copiado ? 'Copiado' : 'Copiar resumo'}
            </button>
          </div>
          <p className="text-xs text-stone-400">
            O WhatsApp recebe o resumo em texto. Para mandar o relatório completo, salve em PDF pelo botão de impressão e anexe na conversa.
          </p>
        </>
      )}
    </div>
  );

  if (!empresa || !atual || !indicadores) {
    return <div className="space-y-6">{painel}</div>;
  }

  const { ultimos13, mediaFaturamento, ultimos12, anteriores, aliquota, aliquotaAnterior, pendentes } = indicadores;
  const vencimento = vencimentoDas(atual.competencia);
  const dadosTributos = TRIBUTOS_DAS.filter((t) => (atual.tributos[t] ?? 0) > 0).map((t) => ({ nome: t, valor: atual.tributos[t] ?? 0 }));
  const dadosFaturamento = ultimos13.map((r) => ({ mes: nomeMes(r.competencia), valor: r.valor, atual: r.competencia === atual.competencia }));
  const dados12m = ultimos12.map((r) => ({ mes: nomeMes(r.competencia), valor: r.valor }));
  const total12m = ultimos12.reduce((s, r) => s + r.valor, 0);
  const media12m = ultimos12.length > 0 ? total12m / ultimos12.length : 0;
  const primeiro12m = ultimos12[0];
  const variacao12m = primeiro12m && primeiro12m.valor > 0 ? (atual.receitaPA / primeiro12m.valor - 1) * 100 : undefined;
  const dadosImposto = anteriores.slice(-12).map((a) => ({
    mes: nomeMes(a.competencia),
    das: a.valorDas,
    aliquota: a.receitaPA > 0 ? Number(((a.valorDas / a.receitaPA) * 100).toFixed(2)) : 0,
  }));
  const totalPendente = pendentes.reduce((s, a) => s + a.valorDas, 0);
  const historico = [...anteriores].reverse().slice(0, 12);

  const alertas: string[] = [];
  if ((atual.rba ?? 0) > SUBLIMITE_ICMS_ISS * 0.8) {
    alertas.push(`O faturamento acumulado no ano (${formatarMoeda(atual.rba ?? 0)}) se aproxima do sublimite de ${formatarMoeda(SUBLIMITE_ICMS_ISS)} para ICMS/ISS no DAS.`);
  }
  if (aliquotaAnterior !== undefined && aliquota - aliquotaAnterior >= 0.1) {
    alertas.push(`O percentual de imposto sobre o faturamento subiu de ${formatarPercentual(aliquotaAnterior)} para ${formatarPercentual(aliquota)} em relação ao mês anterior.`);
  }
  if (pendentes.length > 0) {
    alertas.push(
      `Há ${pendentes.length} guia(s) vencida(s) sem pagamento confirmado (${formatarMoeda(totalPendente)}). DAS pago em atraso tem multa de 0,33% ao dia (limitada a 20%) mais juros Selic, e débitos em aberto podem levar à exclusão do Simples Nacional.`,
    );
  }

  const dataHoje = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      {painel}

      <article className="space-y-4 impresso:space-y-2.5 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-6 impresso:border-0 impresso:bg-white impresso:p-0">
        {/* Cabeçalho do documento */}
        <header className="print-avoid-break overflow-hidden rounded-xl bg-brand-900 text-white">
          <div className="flex flex-col gap-4 px-5 py-5 impresso:py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <EleveIcon className="h-12 w-12 shrink-0" />
              <div>
                <p className="text-lg font-semibold leading-tight text-gold-100">
                  eleven<span className="text-gold-400">.</span>
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">Contabilidade &amp; Consultoria</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-300">Relatório Fiscal Mensal · Simples Nacional</p>
              <p className="text-xl font-semibold first-letter:uppercase">{nomeMes(atual.competencia, false)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 bg-brand-800 px-5 py-2.5 text-xs text-brand-100">
            <span className="font-semibold text-white">{empresa.razaoSocial}</span>
            <span>CNPJ {atual.cnpj}</span>
            {atual.municipio && (
              <span>
                {atual.municipio}/{atual.uf}
              </span>
            )}
            <span>Anexo {atual.anexos.join(', ') || '—'}</span>
            <span>Emitido em {dataHoje}</span>
          </div>
        </header>

        {/* Indicadores */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi rotulo="Faturamento do mês" valor={formatarMoeda(atual.receitaPA)} detalhe={`Competência ${atual.competencia}`} />
          <Kpi rotulo="Imposto (DAS)" valor={formatarMoeda(atual.valorDas)} detalhe={`Vence em ${formatarData(vencimento)}`} destaque />
          <Kpi
            rotulo="Imposto sobre o faturamento"
            valor={formatarPercentual(aliquota)}
            detalhe={aliquotaAnterior !== undefined ? `Mês anterior: ${formatarPercentual(aliquotaAnterior)}` : 'Percentual do faturamento'}
          />
          <Kpi rotulo="RBT12" valor={formatarMoeda(atual.rbt12)} detalhe="Faturamento dos últimos 12 meses" />
        </div>

        {/* Situação dos impostos */}
        <div
          className={`print-avoid-break flex items-start gap-3 rounded-xl border p-4 ${
            pendentes.length === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
          }`}
        >
          {pendentes.length === 0 ? (
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          )}
          <div>
            <p className={`text-sm font-semibold ${pendentes.length === 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              {pendentes.length === 0
                ? 'Impostos anteriores em dia'
                : `${pendentes.length} guia(s) vencida(s) sem pagamento confirmado: ${formatarMoeda(totalPendente)}`}
            </p>
            <p className="text-xs text-stone-600">
              {pendentes.length === 0
                ? `Todas as guias vencidas das competências enviadas constam como pagas ou parceladas. O DAS de ${atual.competencia} vence em ${formatarData(vencimento)}.`
                : `Competências: ${pendentes.map((a) => a.competencia).join(', ')}. Regularize o quanto antes para evitar multa, juros e risco de exclusão do Simples.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Secao titulo="Faturamento mensal">
            <div className="h-56 w-full impresso:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosFaturamento} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRADE} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: TEXTO_EIXO }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={40} />
                  <YAxis tickFormatter={eixoMoeda} tick={{ fontSize: 10, fill: TEXTO_EIXO }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} cursor={{ fill: '#f5f5f4' }} />
                  {mediaFaturamento > 0 && <ReferenceLine y={mediaFaturamento} stroke={GOLD} strokeDasharray="4 4" />}
                  <Bar dataKey="valor" name="Faturamento" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {dadosFaturamento.map((d) => (
                      <Cell key={d.mes} fill={d.atual ? GOLD : BRAND} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Em dourado, o mês do relatório.{mediaFaturamento > 0 && ` Linha tracejada: média dos meses anteriores (${formatarMoeda(mediaFaturamento)}).`}
            </p>
          </Secao>

          <Secao titulo="Evolução do faturamento nos últimos 12 meses">
            {dados12m.length > 1 ? (
              <>
                <div className="h-56 w-full impresso:h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados12m} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={GRADE} vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: TEXTO_EIXO }} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={40} />
                      <YAxis
                        tickFormatter={eixoMoeda}
                        tick={{ fontSize: 10, fill: TEXTO_EIXO }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        domain={[(min: number) => Math.floor(min * 0.9), (max: number) => Math.ceil(max * 1.05)]}
                      />
                      <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} />
                      <ReferenceLine y={media12m} stroke={GOLD} strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        name="Faturamento"
                        stroke={BRAND}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: BRAND }}
                        activeDot={{ r: 5, fill: GOLD }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Total dos 12 meses: <strong className="text-stone-700">{formatarMoeda(total12m)}</strong>. Linha tracejada: média mensal (
                  {formatarMoeda(media12m)}).
                  {variacao12m !== undefined &&
                    ` Variação de ${nomeMes(primeiro12m.competencia)} para ${nomeMes(atual.competencia)}: ${variacao12m >= 0 ? '+' : ''}${formatarPercentual(variacao12m, 1)}.`}
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-500">Histórico de receitas insuficiente para mostrar a evolução.</p>
            )}
          </Secao>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Secao titulo="Para onde vai o imposto do mês">
            <div className="flex items-center gap-3">
              <div className="h-40 w-40 shrink-0 impresso:h-28 impresso:w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosTributos} dataKey="valor" nameKey="nome" innerRadius="55%" outerRadius="95%" paddingAngle={1} isAnimationActive={false}>
                      {dadosTributos.map((d, i) => (
                        <Cell key={d.nome} fill={CORES_TRIBUTOS[i % CORES_TRIBUTOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <table className="w-full whitespace-nowrap text-xs">
                <tbody>
                  {dadosTributos.map((d, i) => (
                    <tr key={d.nome} className="border-b border-stone-100 last:border-0">
                      <td className="py-1">
                        <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: CORES_TRIBUTOS[i % CORES_TRIBUTOS.length] }} />
                        {d.nome}
                      </td>
                      <td className="py-1 text-right tabular-nums">{formatarMoeda(d.valor)}</td>
                      <td className="py-1 text-right tabular-nums text-stone-500">{formatarPercentual((d.valor / atual.valorDas) * 100, 1)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-1.5">Total DAS</td>
                    <td className="pt-1.5 text-right tabular-nums">{formatarMoeda(atual.valorDas)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Secao>

          <Secao titulo="Imposto pago por mês">
            <div className="h-48 w-full impresso:h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosImposto} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRADE} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: TEXTO_EIXO }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, (max: number) => max * 1.05]} />
                  <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} cursor={{ fill: '#f5f5f4' }} />
                  <Bar dataKey="das" name="Imposto pago" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={90} isAnimationActive={false}>
                    <LabelList
                      dataKey="das"
                      content={(props) => {
                        const { x, y, width, height, index } = props as { x: number; y: number; width: number; height: number; index: number };
                        const item = dadosImposto[index];
                        if (!item || height < 30) return null;
                        const cx = x + width / 2;
                        const cy = y + height / 2;
                        const compacto = width < 70;
                        return (
                          <g>
                            <text x={cx} y={cy - 5} textAnchor="middle" fill="#ffffff" fontSize={compacto ? 10 : 13} fontWeight={700}>
                              {formatarMoeda(item.das)}
                            </text>
                            <text x={cx} y={cy + 14} textAnchor="middle" fill="#f6dfa1" fontSize={compacto ? 10 : 12}>
                              {formatarPercentual(item.aliquota)}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Secao>
        </div>

        {/* Histórico de guias */}
        <Secao titulo="Histórico de apurações e pagamentos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="py-2 impresso:py-1 font-medium">Competência</th>
                  <th className="py-2 impresso:py-1 text-right font-medium">Faturamento</th>
                  <th className="py-2 impresso:py-1 text-right font-medium">DAS</th>
                  <th className="py-2 impresso:py-1 text-right font-medium">% imposto</th>
                  <th className="py-2 impresso:py-1 pl-3 font-medium">Vencimento</th>
                  <th className="py-2 impresso:py-1 font-medium">Situação</th>
                  <th className="no-print py-2" />
                </tr>
              </thead>
              <tbody>
                {historico.map((a) => {
                  const situacao = situacaoDas(a);
                  return (
                    <tr key={a.competencia} className={`border-b border-stone-100 last:border-0 ${a.competencia === atual.competencia ? 'bg-gold-50' : ''}`}>
                      <td className="py-2 impresso:py-1 font-medium text-stone-800">
                        {a.competencia}
                        {a.retificadora && <span className="ml-1 text-[10px] text-stone-400">(retificada)</span>}
                      </td>
                      <td className="py-2 impresso:py-1 text-right tabular-nums">{formatarMoeda(a.receitaPA)}</td>
                      <td className="py-2 impresso:py-1 text-right tabular-nums">{formatarMoeda(a.valorDas)}</td>
                      <td className="py-2 impresso:py-1 text-right tabular-nums">{a.receitaPA > 0 ? formatarPercentual((a.valorDas / a.receitaPA) * 100) : '—'}</td>
                      <td className="py-2 impresso:py-1 pl-3 tabular-nums">{formatarData(vencimentoDas(a.competencia))}</td>
                      <td className="py-2 impresso:py-1">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTILO_SITUACAO[situacao]}`}>
                          {ROTULO_SITUACAO[situacao]}
                          {situacao === 'pago' && a.dataPagamento ? ` em ${isoParaBr(a.dataPagamento)}` : ''}
                        </span>
                        {a.valorPago !== undefined && a.valorPago < a.valorDas - 0.05 && (
                          <span className="ml-1 text-[11px] text-stone-500">pago parcial: {formatarMoeda(a.valorPago)}</span>
                        )}
                      </td>
                      <td className="no-print py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs"
                            value={a.status}
                            onChange={(e) => alterarStatus(a.competencia, e.target.value as StatusPagamento)}
                            title="Situação do pagamento"
                          >
                            {(Object.keys(ROTULO_STATUS) as StatusPagamento[]).map((s) => (
                              <option key={s} value={s}>
                                {ROTULO_STATUS[s]}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs"
                            value={a.dataPagamento ?? ''}
                            onChange={(e) => alterarDataPagamento(a.competencia, e.target.value)}
                            title="Data do pagamento"
                          />
                          <button
                            onClick={() => excluirCompetencia(a.competencia)}
                            className="rounded p-1 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Remover esta competência"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            A situação do pagamento vem do extrato do PGDAS-D ou é conferida pela contabilidade no e-CAC. "Não confirmado" indica guia vencida cujo pagamento ainda não
            foi verificado.
          </p>
        </Secao>

        {alertas.length > 0 && (
          <Secao titulo="Pontos de atenção">
            <ul className="space-y-2">
              {alertas.map((a) => (
                <li key={a} className="flex gap-2 text-sm text-stone-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                  {a}
                </li>
              ))}
            </ul>
          </Secao>
        )}

        <Secao titulo="Observações da contabilidade" className={empresa.observacoes?.trim() ? '' : 'impresso:hidden'}>
          <textarea
            className="no-print min-h-20 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Escreva aqui uma orientação para o cliente (aparece no relatório impresso)."
            value={empresa.observacoes ?? ''}
            onChange={(e) => setCarteira(atualizarEmpresa(carteira, empresa.cnpj, { observacoes: e.target.value }))}
          />
          <p className="hidden whitespace-pre-line text-sm text-stone-700 impresso:block">
            {empresa.observacoes?.trim() || 'Sem observações adicionais para esta competência.'}
          </p>
        </Secao>

        <footer className="print-avoid-break overflow-hidden rounded-xl">
          <p className="bg-white py-2 text-center text-[11px] italic text-stone-500">
            Contador(a) responsável: Kauane Gomes · Fonte: declaração do PGDAS-D nº {atual.numeroDeclaracao ?? '—'}
            {atual.dataTransmissao ? `, transmitida em ${atual.dataTransmissao}` : ''}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-brand-800 px-4 py-2 text-[11px] text-white">
            <span>Tel: (85) 99427-6469</span>
            <span>Email: contabilidade@somoseleven.com</span>
            <span>@eleven.contabilidade</span>
          </div>
        </footer>
      </article>
    </div>
  );
}
