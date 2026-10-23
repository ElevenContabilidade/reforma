import { useState } from 'react';
import { CalendarDays, Inbox, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';
import clsx from 'clsx';
import { EleveLogo } from '../../components/EleveLogo';
import { useMei } from '../lib/store';
import { ClienteDetalhe } from './ClienteDetalhe';
import { Painel } from './Painel';
import { Agenda, Clientes, Configuracoes, Solicitacoes } from './Paginas';

type Pagina = 'painel' | 'clientes' | 'agenda' | 'solicitacoes' | 'config';

export function EscritorioApp() {
  const { base, sair } = useMei();
  const [pagina, setPagina] = useState<Pagina>('painel');
  const [clienteAberto, setClienteAberto] = useState<string | null>(null);

  const abertas = base.mensagens.filter((m) => m.de === 'cliente' && !m.resolvida).length;
  const itens: { id: Pagina; rotulo: string; icone: typeof Users; contador?: number }[] = [
    { id: 'painel', rotulo: 'Painel', icone: LayoutDashboard },
    { id: 'clientes', rotulo: 'Clientes', icone: Users },
    { id: 'agenda', rotulo: 'Agenda', icone: CalendarDays },
    { id: 'solicitacoes', rotulo: 'Solicitações', icone: Inbox, contador: abertas },
    { id: 'config', rotulo: 'Configurações', icone: Settings },
  ];

  function navegar(p: Pagina) {
    setPagina(p);
    setClienteAberto(null);
  }

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <aside className="no-print flex w-full shrink-0 flex-col bg-brand-900 text-stone-300 lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div className="border-b border-white/10 px-5 py-5">
          <EleveLogo />
          <div className="mt-4 border-t border-white/10 pt-3 text-center">
            <p className="text-sm font-semibold text-white">Gestão MEI</p>
            <p className="text-[11px] text-stone-400">Área do escritório</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:py-5">
          {itens.map(({ id, rotulo, icone: Icone, contador }) => (
            <button
              key={id}
              onClick={() => navegar(id)}
              className={clsx(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                pagina === id ? 'bg-gold-200 text-brand-900' : 'text-stone-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icone className="h-4 w-4 shrink-0" />
              {rotulo}
              {contador ? <span className="ml-auto rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-brand-900">{contador}</span> : null}
            </button>
          ))}
        </nav>
        <button onClick={sair} className="hidden items-center gap-2 border-t border-white/10 px-6 py-4 text-sm text-stone-400 hover:text-white lg:flex">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl">
          {clienteAberto ? (
            <ClienteDetalhe clienteId={clienteAberto} onVoltar={() => setClienteAberto(null)} />
          ) : (
            <>
              {pagina === 'painel' && <Painel onAbrirCliente={setClienteAberto} />}
              {pagina === 'clientes' && <Clientes onAbrirCliente={setClienteAberto} />}
              {pagina === 'agenda' && <Agenda onAbrirCliente={setClienteAberto} />}
              {pagina === 'solicitacoes' && <Solicitacoes onAbrirCliente={setClienteAberto} />}
              {pagina === 'config' && <Configuracoes />}
            </>
          )}
          <button onClick={sair} className="no-print mt-10 flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 lg:hidden">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </main>
    </div>
  );
}
