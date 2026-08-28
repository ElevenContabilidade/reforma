import { useEffect, useState } from 'react';
import type { DadosEmpresa, SimulacaoSalva } from './lib/types';
import { novaDadosEmpresa } from './lib/defaults';
import { gerarId, listarSimulacoes, salvarSimulacao, excluirSimulacao } from './lib/storage';
import { Sidebar, type Pagina } from './components/Sidebar';
import { EmpresaForm } from './components/EmpresaForm';
import { ItensChecklist } from './components/ItensChecklist';
import { UploadPgdas } from './components/UploadPgdas';
import { Dashboard } from './components/Dashboard';
import { ConsultaClassificacao } from './components/ConsultaClassificacao';
import { NCM_ITENS } from './lib/ncmData';
import { NBS_ITENS } from './lib/nbsData';

export default function App() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoSalva[]>([]);
  const [idAtual, setIdAtual] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosEmpresa>(novaDadosEmpresa());
  const [pagina, setPagina] = useState<Pagina>('empresa');

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
    <div className="min-h-screen bg-slate-50 lg:flex">
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
        <div className="mx-auto max-w-5xl">
          {pagina === 'empresa' && <EmpresaForm dados={dados} onChange={setDados} />}
          {pagina === 'itens' && <ItensChecklist dados={dados} onChange={setDados} />}
          {pagina === 'upload' && <UploadPgdas dados={dados} onChange={setDados} />}
          {pagina === 'ncm' && (
            <ConsultaClassificacao
              titulo="Produto / NCM"
              subtitulo="Descubra o tratamento tributário de um produto pela Reforma (redução de alíquota de CBS/IBS por NCM)."
              placeholder="Digite o NCM, produto ou palavra-chave (ex: arroz, celular, medicamento)"
              itens={NCM_ITENS}
              rotuloCodigo="NCM"
            />
          )}
          {pagina === 'nbs' && (
            <ConsultaClassificacao
              titulo="Serviço / NBS"
              subtitulo="Descubra o tratamento tributário de uma atividade ou serviço pela Reforma (redução de alíquota de CBS/IBS por NBS)."
              placeholder="Digite o NBS, atividade ou palavra-chave (ex: transporte, advocacia, saúde)"
              itens={NBS_ITENS}
              rotuloCodigo="NBS"
            />
          )}
          {pagina === 'dashboard' && <Dashboard dados={dados} />}
        </div>
      </main>
    </div>
  );
}
