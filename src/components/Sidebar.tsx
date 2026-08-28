import { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  Building2,
  ListChecks,
  FileUp,
  Package,
  Briefcase,
  LayoutDashboard,
} from 'lucide-react';
import type { SimulacaoSalva } from '../lib/types';
import { EleveLogo } from './EleveLogo';

export type Pagina = 'empresa' | 'itens' | 'upload' | 'ncm' | 'nbs' | 'dashboard';

interface GrupoNav {
  titulo: string;
  itens: { id: Pagina; label: string; icon: typeof Building2 }[];
}

const GRUPOS: GrupoNav[] = [
  {
    titulo: 'Empresa',
    itens: [
      { id: 'empresa', label: 'Dados da empresa', icon: Building2 },
      { id: 'itens', label: 'Produtos e serviços', icon: ListChecks },
      { id: 'upload', label: 'Upload PGDAS', icon: FileUp },
    ],
  },
  {
    titulo: 'Consultas',
    itens: [
      { id: 'ncm', label: 'Produto / NCM', icon: Package },
      { id: 'nbs', label: 'Serviço / NBS', icon: Briefcase },
    ],
  },
  {
    titulo: 'Resultados',
    itens: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
];

interface Props {
  pagina: Pagina;
  onNavegar: (p: Pagina) => void;
  simulacoes: SimulacaoSalva[];
  idAtual: string | null;
  onSelecionarCliente: (id: string) => void;
  onNovoCliente: () => void;
  onExcluirCliente: (id: string) => void;
}

export function Sidebar({ pagina, onNavegar, simulacoes, idAtual, onSelecionarCliente, onNovoCliente, onExcluirCliente }: Props) {
  const [listaAberta, setListaAberta] = useState(false);
  const clienteAtual = simulacoes.find((s) => s.id === idAtual);

  return (
    <aside className="no-print flex w-full shrink-0 flex-col bg-brand-900 text-stone-300 lg:h-screen lg:w-72 lg:sticky lg:top-0 lg:overflow-y-auto">
      <div className="border-b border-white/10 px-5 py-6">
        <EleveLogo />
        <div className="mt-4 border-t border-white/10 pt-3 text-center">
          <p className="text-sm font-semibold text-white">Simulador Tributário</p>
          <p className="text-[11px] text-stone-400">Reforma Tributária</p>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-4">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Cliente</p>
        <div className="relative">
          <button
            onClick={() => setListaAberta((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10"
          >
            <span className="truncate">{clienteAtual?.dados.nomeCliente || 'Cliente sem nome'}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition ${listaAberta ? 'rotate-180' : ''}`} />
          </button>

          {listaAberta && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-brand-800 shadow-xl">
              <button
                onClick={() => {
                  onNovoCliente();
                  setListaAberta(false);
                }}
                className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left text-sm text-gold-300 transition hover:bg-white/5"
              >
                <Plus className="h-4 w-4" />
                Novo cliente
              </button>
              <div className="max-h-64 overflow-y-auto">
                {simulacoes.length === 0 && <p className="px-3 py-4 text-center text-xs text-stone-500">Nenhum cliente salvo.</p>}
                {simulacoes.map((s) => (
                  <div key={s.id} className={`group flex items-center gap-1 px-1.5 ${s.id === idAtual ? 'bg-white/10' : ''}`}>
                    <button
                      onClick={() => {
                        onSelecionarCliente(s.id);
                        setListaAberta(false);
                      }}
                      className="flex-1 truncate px-1.5 py-2 text-left text-sm text-stone-200"
                    >
                      {s.dados.nomeCliente || 'Cliente sem nome'}
                    </button>
                    <button
                      onClick={() => onExcluirCliente(s.id)}
                      className="rounded p-1 text-stone-500 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                      title="Excluir cliente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-4 py-5">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">{grupo.titulo}</p>
            <div className="space-y-1">
              {grupo.itens.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavegar(id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    pagina === id ? 'bg-gold-200 text-brand-900' : 'text-stone-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
