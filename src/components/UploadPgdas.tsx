import { useRef, useState } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { extrairDadosPgdas } from '../lib/pgdasParser';
import type { DadosEmpresa, DadosExtraidosPgdas } from '../lib/types';
import { formatarMoeda } from '../lib/format';

interface Props {
  dados: DadosEmpresa;
  onChange: (dados: DadosEmpresa) => void;
}

export function UploadPgdas({ dados, onChange }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [extraido, setExtraido] = useState<DadosExtraidosPgdas | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processarArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    if (arquivo.type !== 'application/pdf') {
      setErro('Envie o extrato do PGDAS-D em formato PDF.');
      return;
    }
    setCarregando(true);
    setErro(null);
    setExtraido(null);
    try {
      const resultado = await extrairDadosPgdas(arquivo);
      setExtraido(resultado);
      if (!resultado.textoDetectado) {
        setErro(
          'Não foi possível localizar automaticamente os campos no PDF (pode ser um PDF escaneado/imagem). Preencha os dados manualmente na aba "Dados da empresa".',
        );
      }
    } catch (e) {
      console.error(e);
      setErro('Falha ao ler o PDF. Verifique se o arquivo não está corrompido ou protegido por senha.');
    } finally {
      setCarregando(false);
    }
  }

  function aplicarDados() {
    if (!extraido) return;
    onChange({
      ...dados,
      rbt12: extraido.rbt12 ?? dados.rbt12,
      faturamentoMensal: extraido.faturamentoMensal ?? dados.faturamentoMensal,
      folhaPagamento12m: extraido.folhaPagamento12m ?? dados.folhaPagamento12m,
      anexoSimples: extraido.anexo ?? dados.anexoSimples,
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Upload do extrato PGDAS-D</h2>
      <p className="mb-5 text-sm text-slate-500">
        Envie o PDF do extrato do PGDAS-D (Programa Gerador do DAS) para preencher automaticamente RBT12, faturamento do
        período, folha de pagamento e o anexo do Simples Nacional. Confira sempre os valores extraídos antes de simular.
      </p>

      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          arrastando ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          processarArquivo(e.dataTransfer.files[0]);
        }}
      >
        {carregando ? (
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        ) : (
          <FileUp className="h-8 w-8 text-slate-400" />
        )}
        <div>
          <p className="text-sm font-medium text-slate-700">Arraste o PDF aqui ou clique para selecionar</p>
          <p className="text-xs text-slate-400">Somente arquivos PDF do extrato PGDAS-D</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
        >
          Selecionar arquivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => processarArquivo(e.target.files?.[0])}
        />
      </div>

      {erro && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {extraido && extraido.textoDetectado && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Dados encontrados no PDF
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">RBT12</dt>
              <dd className="font-medium text-slate-800">{extraido.rbt12 ? formatarMoeda(extraido.rbt12) : '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Faturamento do período</dt>
              <dd className="font-medium text-slate-800">
                {extraido.faturamentoMensal ? formatarMoeda(extraido.faturamentoMensal) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Folha (FS12)</dt>
              <dd className="font-medium text-slate-800">
                {extraido.folhaPagamento12m ? formatarMoeda(extraido.folhaPagamento12m) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Anexo</dt>
              <dd className="font-medium text-slate-800">{extraido.anexo ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Valor do DAS</dt>
              <dd className="font-medium text-slate-800">{extraido.valorDas ? formatarMoeda(extraido.valorDas) : '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Competência</dt>
              <dd className="font-medium text-slate-800">{extraido.competencia ?? '—'}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={aplicarDados}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            Aplicar dados ao formulário
          </button>
        </div>
      )}
    </section>
  );
}
