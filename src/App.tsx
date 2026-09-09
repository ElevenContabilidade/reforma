import { useEffect, useState } from 'react';
import type { DadosEmpresa, SimulacaoSalva } from './lib/types';
import { novaDadosEmpresa } from './lib/defaults';
import { gerarId, listarSimulacoes, salvarSimulacao, excluirSimulacao } from './lib/storage';
import { Sidebar, type Pagina } from './components/Sidebar';
import { EmpresaForm } from './components/EmpresaForm';
import { ItensChecklist } from './components/ItensChecklist';
import { UploadPgdas } from './components/UploadPgdas';
import { Dashboard } from './components/Dashboard';
import { Comparacao } from './components/Comparacao';
import { ConsultaOficial } from './components/ConsultaOficial';

export default function App() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoSalva[]>([]);
  const [idAtual, setIdAtual] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosEmpresa>(novaDadosEmpresa());
  const [pagina, setPagina] = useState<Pagina>('empresa');

  useEffect(() => {
    const lista = listarSimulacoes();
    setSimulacoes(lista);

    const params = new URLSearchParams(window.location.search);
    const idParaImprimir = params.get('cliente');
    const simParaImprimir = idParaImprimir ? lista.find((s) => s.id === idParaImprimir) : null;

    if (simParaImprimir) {
      setIdAtual(simParaImprimir.id);
      setDados(simParaImprimir.dados);
    } else if (lista.length > 0) {
      setIdAtual(lista[0].id);
      setDados(lista[0].dados);
    } else {
      const id = gerarId();
      setIdAtual(id);
    }

    if (params.get('print') === '1') {
      setPagina('dashboard');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => window.print(), 600);
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
    setPagina('empresa');
  }

  function handleSelecionar(id: string) {
    const sim = simulacoes.find((s) => s.id === id);
    if (!sim) return;
    setIdAtual(id);
    setDados(sim.dados);
    setPagina('empresa');
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
    <div className="min-h-screen bg-stone-50 lg:flex">
      <Sidebar
        pagina={pagina}
        onNavegar={setPagina}
        simulacoes={simulacoes}
        idAtual={idAtual}
        onSelecionarCliente={handleSelecionar}
        onNovoCliente={handleNovo}
        onExcluirCliente={handleExcluir}
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="print-area mx-auto max-w-5xl">
          {pagina === 'empresa' && <EmpresaForm dados={dados} onChange={setDados} />}
          {pagina === 'itens' && <ItensChecklist dados={dados} onChange={setDados} />}
          {pagina === 'upload' && <UploadPgdas dados={dados} onChange={setDados} />}
          {pagina === 'ncm' && (
            <ConsultaOficial
              tipo="NCM"
              titulo="Produto / NCM"
              subtitulo="Consulte a tabela NCM oficial vigente e veja a ficha tributária completa (CST, cClassTrib, reduções de IBS/CBS, base legal e documentos aceitos)."
              placeholder="Digite o NCM, produto ou palavra-chave (ex: arroz, celular, medicamento)"
            />
          )}
          {pagina === 'nbs' && (
            <ConsultaOficial
              tipo="NBS"
              titulo="Serviço / NBS"
              subtitulo="Consulte a Nomenclatura Brasileira de Serviços oficial e veja a ficha tributária completa (CST, cClassTrib, reduções de IBS/CBS, base legal e documentos aceitos)."
              placeholder="Digite o NBS, atividade ou palavra-chave (ex: transporte, advocacia, saúde)"
            />
          )}
          {pagina === 'dashboard' && <Dashboard dados={dados} idAtual={idAtual} />}
          {pagina === 'comparacao' && <Comparacao dados={dados} />}
        </div>
      </main>
    </div>
  );
}
