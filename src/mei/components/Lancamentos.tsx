import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { Field, TextInput, SelectInput } from '../../components/Field';
import { formatarMoeda } from '../../lib/format';
import { novoLancamento } from '../lib/base';
import {
  CATEGORIAS_DESPESA,
  CATEGORIAS_RECEITA,
  competencia,
  formatarData,
  opcoesDeMes,
  rotuloCategoria,
} from '../lib/regras';
import { useMei } from '../lib/store';
import type { Lancamento, Perfil } from '../lib/types';
import { Aviso, Vazio, botaoPrimario, botaoSecundario, inputBase } from './ui';

export function LancamentoForm({
  inicial,
  onSalvo,
  onCancelar,
}: {
  inicial: Lancamento;
  onSalvo: () => void;
  onCancelar?: () => void;
}) {
  const { salvarLancamento } = useMei();
  const [l, setL] = useState(inicial);
  const ehReceita = l.tipo === 'receita';
  const valido = l.valor > 0 && l.data.length === 10 && l.descricao.trim().length > 0;

  function trocarTipo(tipo: Lancamento['tipo']) {
    setL({ ...l, tipo, categoria: tipo === 'receita' ? 'servico' : 'outras', tomadorPj: false });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        salvarLancamento({ ...l, descricao: l.descricao.trim() });
        onSalvo();
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-stone-100 p-1">
        {(['receita', 'despesa'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => trocarTipo(t)}
            className={clsx(
              'rounded-md py-2 text-sm font-semibold transition',
              l.tipo === t ? (t === 'receita' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'text-stone-600',
            )}
          >
            {t === 'receita' ? 'Entrada (venda/serviço)' : 'Saída (despesa)'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data">
          <input type="date" className={inputBase} value={l.data} onChange={(e) => setL({ ...l, data: e.target.value })} />
        </Field>
        <Field label="Valor (R$)">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className={inputBase}
            value={l.valor || ''}
            placeholder="0,00"
            onChange={(e) => setL({ ...l, valor: e.target.valueAsNumber || 0 })}
          />
        </Field>
      </div>

      <Field label="Descrição">
        <TextInput
          value={l.descricao}
          onChange={(descricao) => setL({ ...l, descricao })}
          placeholder={ehReceita ? 'Ex: Serviço para cliente Fulano' : 'Ex: Compra de material'}
        />
      </Field>

      <Field
        label={ehReceita ? 'Tipo de receita' : 'Categoria'}
        hint={ehReceita ? 'Separa as linhas do relatório mensal: comércio, indústria e serviços.' : undefined}
      >
        <SelectInput
          value={l.categoria}
          onChange={(categoria) => setL({ ...l, categoria })}
          options={ehReceita ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA}
        />
      </Field>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-600"
            checked={l.comNota}
            onChange={(e) => setL({ ...l, comNota: e.target.checked })}
          />
          {ehReceita ? 'Emiti nota fiscal' : 'Tenho nota fiscal / recibo'}
        </label>
        {ehReceita && (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={l.tomadorPj}
              onChange={(e) => setL({ ...l, tomadorPj: e.target.checked })}
            />
            O cliente é uma empresa (tem CNPJ)
          </label>
        )}
      </div>

      {ehReceita && l.tomadorPj && !l.comNota && (
        <Aviso tom="alerta" titulo="Nota fiscal obrigatória">
          Venda ou serviço para empresa (CNPJ) exige nota fiscal, mesmo no MEI. Para pessoa física, a nota só é
          obrigatória se o cliente pedir.
        </Aviso>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={!valido} className={botaoPrimario}>
          Salvar lançamento
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className={botaoSecundario}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function ListaLancamentos({ clienteId, origem }: { clienteId: string; origem: Perfil }) {
  const { base, excluirLancamento } = useMei();
  const [mes, setMes] = useState(() => competencia(new Date()));
  const [editando, setEditando] = useState<Lancamento | null>(null);

  const itens = useMemo(
    () =>
      base.lancamentos
        .filter((l) => l.clienteId === clienteId && l.data.startsWith(mes))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [base.lancamentos, clienteId, mes],
  );
  const entradas = itens.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
  const saidas = itens.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);

  const opcoesMes = useMemo(() => opcoesDeMes(18), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-56">
          <SelectInput value={mes} onChange={setMes} options={opcoesMes} />
        </div>
        <button className={botaoPrimario} onClick={() => setEditando(novoLancamento(clienteId, 'receita', origem))}>
          <Plus className="h-4 w-4" />
          Novo lançamento
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Resumo rotulo="Entradas" valor={entradas} classe="text-emerald-700" />
        <Resumo rotulo="Saídas" valor={saidas} classe="text-rose-700" />
        <Resumo rotulo="Resultado" valor={entradas - saidas} classe={entradas - saidas >= 0 ? 'text-brand-900' : 'text-rose-700'} />
      </div>

      {editando && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-brand-900">
              {itens.some((i) => i.id === editando.id) ? 'Editar lançamento' : 'Novo lançamento'}
            </p>
            <button onClick={() => setEditando(null)} className="text-stone-400 hover:text-stone-700" title="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <LancamentoForm key={editando.id} inicial={editando} onSalvo={() => setEditando(null)} onCancelar={() => setEditando(null)} />
        </div>
      )}

      {itens.length === 0 ? (
        <Vazio>Nenhum lançamento neste mês.</Vazio>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {itens.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{l.descricao}</p>
                <p className="text-xs text-stone-500">
                  {formatarData(l.data)} · {rotuloCategoria(l.categoria)}
                  {l.tipo === 'receita' && (l.comNota ? ' · com nota' : ' · sem nota')}
                  {l.tipo === 'receita' && l.tomadorPj && ' · cliente PJ'}
                </p>
                {l.tipo === 'receita' && l.tomadorPj && !l.comNota && (
                  <p className="mt-0.5 text-xs font-medium text-amber-700">Falta emitir a nota fiscal (cliente PJ).</p>
                )}
              </div>
              <span className={clsx('text-sm font-semibold tabular-nums', l.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700')}>
                {l.tipo === 'receita' ? '+' : '-'} {formatarMoeda(l.valor)}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setEditando(l)} className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700" title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Excluir este lançamento?')) excluirLancamento(l.id);
                  }}
                  className="rounded p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Resumo({ rotulo, valor, classe }: { rotulo: string; valor: number; classe: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-2 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{rotulo}</p>
      <p className={clsx('mt-0.5 text-sm font-bold tabular-nums sm:text-base', classe)}>{formatarMoeda(valor)}</p>
    </div>
  );
}

