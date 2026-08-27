import { useEffect, useState } from 'react';
import { Building2, FileUp, ListChecks, LayoutDashboard, Scale } from 'lucide-react';
import type { DadosEmpresa, SimulacaoSalva } from './lib/types';
import { novaDadosEmpresa } from './lib/defaults';
import { gerarId, listarSimulacoes, salvarSimulacao, excluirSimulacao } from './lib/storage';
import { SimulacoesSidebar } from './components/SimulacoesSidebar';
import { EmpresaForm } from './components/EmpresaForm';
import { ItensChecklist } from './components/ItensChecklist';
import { UploadPgdas } from './components/UploadPgdas';
import { Dashboard } from './components/Dashboard';

type Aba = 'empresa' | 'itens' | 'upload' | 'dashboard';

const ABAS: { id: Aba; label: string; icon: typeof Building2 }[] = [
  { id: 'empresa', label: 'Dados da empresa', icon: Building2 },
  { id: 'itens', label: 'Produtos e serviços', icon: ListChecks },
  { id: 'upload', label: 'Upload PGDAS', icon: FileUp },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function App() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoSalva[]>([]);
  const [idAtual, setIdAtual] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosEmpresa>(novaDadosEmpresa());
  const [aba, setAba] = useState<Aba>('empresa');

  useEffect(() => {
    const lista = listarSimulacoes();
    setSimulacoes(lista);
    if (lista.length > 0) {
      setIdAtual(lista[0].id);
      setDados(lista[0].dados);
    } else {
      const id = gerarId();
      setIdAtual(id);
    }
  }, []);

  useEffect(() => {
    if (!idAtual) return;
    const timeout = setTimeout(() => {
      setSimulacoes(salvarSimulacao(idAtual, dados));
    }, 400);
    return () => clearTimeout(timeout);
  }, [dados, idAtual]);

  function handleNovo() {
    const id = gerarId();
    setIdAtual(id);
    setDados(novaDadosEmpresa());
    setAba('empresa');
  }

  function handleSelecionar(id: string) {
    const sim = simulacoes.find((s) => s.id === id);
    if (!sim) return;
    setIdAtual(id);
    setDados(sim.dados);
    setAba('empresa');
  }

  function handleExcluir(id: string) {
    const restantes = excluirSimulacao(id);
    setSimulacoes(restantes);
    if (id === idAtual) {
      if (restantes.length > 0) {
        setIdAtual(restantes[0].id);
        setDados(restantes[0].dados);
      } else {
        handleNovo();
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="rounded-xl bg-teal-600 p-2 text-white">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Simulador da Reforma Tributária</h1>
            <p className="text-xs text-slate-500">Simples Nacional × Híbrido × Lucro Presumido × Lucro Real</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <SimulacoesSidebar
          simulacoes={simulacoes}
          idAtual={idAtual}
          onSelecionar={handleSelecionar}
          onNovo={handleNovo}
          onExcluir={handleExcluir}
        />

        <div className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {ABAS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  aba === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          {aba === 'empresa' && <EmpresaForm dados={dados} onChange={setDados} />}
          {aba === 'itens' && <ItensChecklist dados={dados} onChange={setDados} />}
          {aba === 'upload' && <UploadPgdas dados={dados} onChange={setDados} />}
          {aba === 'dashboard' && <Dashboard dados={dados} />}
        </div>
      </main>
    </div>
  );
}
