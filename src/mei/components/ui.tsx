import type { ReactNode } from 'react';
import clsx from 'clsx';
import { formatarMoeda } from '../../lib/format';
import type { FaixaLimite, SituacaoLimite, StatusDas } from '../lib/regras';

export const inputBase =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export const botaoPrimario =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50';

export const botaoSecundario =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50';

export const botaoWhats =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700';

export function Cabecalho({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-stone-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-xl border border-stone-200 bg-white p-5 shadow-sm', className)}>{children}</div>;
}

export function Indicador({
  rotulo,
  valor,
  detalhe,
  tom = 'neutro',
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: 'neutro' | 'bom' | 'alerta' | 'ruim';
}) {
  const cor = { neutro: 'text-brand-900', bom: 'text-emerald-700', alerta: 'text-amber-700', ruim: 'text-rose-700' }[tom];
  return (
    <Cartao className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{rotulo}</p>
      <p className={clsx('mt-1 text-2xl font-bold tabular-nums', cor)}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-stone-500">{detalhe}</p>}
    </Cartao>
  );
}

const ESTILO_FAIXA: Record<FaixaLimite, { badge: string; barra: string; rotulo: string }> = {
  ok: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', barra: 'bg-emerald-500', rotulo: 'Ok' },
  atencao: { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', barra: 'bg-amber-400', rotulo: 'Atenção' },
  alerta: { badge: 'bg-orange-50 text-orange-700 ring-orange-600/20', barra: 'bg-orange-500', rotulo: 'Alerta' },
  excedido: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', barra: 'bg-rose-500', rotulo: 'Excedido' },
  desenquadrado: { badge: 'bg-rose-100 text-rose-800 ring-rose-700/30', barra: 'bg-rose-700', rotulo: 'Acima de 20%' },
};

export function SeloFaixa({ faixa }: { faixa: FaixaLimite }) {
  const e = ESTILO_FAIXA[faixa];
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', e.badge)}>
      {e.rotulo}
    </span>
  );
}

export function BarraLimite({
  situacao,
  receita,
  limite,
  projecao,
  compacta,
}: {
  situacao: SituacaoLimite;
  receita: number;
  limite: number;
  projecao?: number;
  compacta?: boolean;
}) {
  const largura = Math.min(100, situacao.percentual);
  const marcaProjecao = projecao && limite > 0 ? Math.min(100, (projecao / limite) * 100) : null;
  return (
    <div>
      {!compacta && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold tabular-nums text-stone-900">{formatarMoeda(receita)}</span>
          <span className="text-xs text-stone-500">de {formatarMoeda(limite)}</span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div className={clsx('h-full rounded-full transition-all', ESTILO_FAIXA[situacao.faixa].barra)} style={{ width: `${largura}%` }} />
        {marcaProjecao !== null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-brand-900/70"
            style={{ left: `calc(${marcaProjecao}% - 1px)` }}
            title={`Projeção para dezembro: ${formatarMoeda(projecao ?? 0)}`}
          />
        )}
      </div>
      {!compacta && (
        <p className="mt-1.5 text-xs text-stone-500">
          {situacao.percentual.toFixed(1).replace('.', ',')}% usado
          {situacao.saldo > 0 ? ` · ainda cabem ${formatarMoeda(situacao.saldo)}` : ''}
          {projecao ? ` · projeção dez: ${formatarMoeda(projecao)}` : ''}
        </p>
      )}
    </div>
  );
}

export function SeloDas({ status }: { status: StatusDas }) {
  const mapa = {
    pago: ['bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'Pago'],
    a_vencer: ['bg-sky-50 text-sky-700 ring-sky-600/20', 'A vencer'],
    vencido: ['bg-rose-50 text-rose-700 ring-rose-600/20', 'Vencido'],
  } as const;
  const [classe, rotulo] = mapa[status];
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', classe)}>
      {rotulo}
    </span>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-500">
      {children}
    </div>
  );
}

export function Aviso({ tom = 'info', titulo, children }: { tom?: 'info' | 'alerta' | 'erro'; titulo?: string; children: ReactNode }) {
  const classe = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    alerta: 'border-amber-200 bg-amber-50 text-amber-900',
    erro: 'border-rose-200 bg-rose-50 text-rose-900',
  }[tom];
  return (
    <div className={clsx('rounded-lg border px-4 py-3 text-sm', classe)}>
      {titulo && <p className="font-semibold">{titulo}</p>}
      <div className={titulo ? 'mt-0.5' : ''}>{children}</div>
    </div>
  );
}

export function Abas<T extends string>({
  abas,
  ativa,
  onChange,
}: {
  abas: { id: T; rotulo: string; contador?: number }[];
  ativa: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="no-print mb-5 flex gap-1 overflow-x-auto border-b border-stone-200">
      {abas.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={clsx(
            'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition',
            ativa === a.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-800',
          )}
        >
          {a.rotulo}
          {a.contador ? (
            <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{a.contador}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
