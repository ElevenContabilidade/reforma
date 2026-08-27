import { Plus, Trash2, Calculator } from 'lucide-react';
import type { SimulacaoSalva } from '../lib/types';

interface Props {
  simulacoes: SimulacaoSalva[];
  idAtual: string | null;
  onSelecionar: (id: string) => void;
  onNovo: () => void;
  onExcluir: (id: string) => void;
}

export function SimulacoesSidebar({ simulacoes, idAtual, onSelecionar, onNovo, onExcluir }: Props) {
  return (
    <aside className="flex w-full flex-col gap-3 lg:w-64 lg:shrink-0">
      <button
        onClick={onNovo}
        className="flex items-center justify-center gap-2 rounded-lg border border-teal-600 bg-teal-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
      >
        <Plus className="h-4 w-4" />
        Novo cliente
      </button>

      <div className="flex flex-col gap-1.5 overflow-y-auto lg:max-h-[calc(100vh-220px)]">
        {simulacoes.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400">Nenhuma simulação salva ainda.</p>
        )}
        {simulacoes.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
              s.id === idAtual ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <button onClick={() => onSelecionar(s.id)} className="flex flex-1 items-center gap-2 overflow-hidden text-left">
              <Calculator className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate font-medium">{s.dados.nomeCliente || 'Cliente sem nome'}</span>
            </button>
            <button
              onClick={() => onExcluir(s.id)}
              className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
              title="Excluir simulação"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
