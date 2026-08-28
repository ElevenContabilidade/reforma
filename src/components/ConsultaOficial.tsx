import { useMemo, useState } from 'react';
import { Search, PackageSearch } from 'lucide-react';
import { buscarNcm, buscarNbs, montarFicha } from '../lib/officialData';
import { FichaTributaria } from './FichaTributaria';

interface Props {
  tipo: 'NCM' | 'NBS';
  titulo: string;
  subtitulo: string;
  placeholder: string;
}

export function ConsultaOficial({ tipo, titulo, subtitulo, placeholder }: Props) {
  const [termo, setTermo] = useState('');
  const [selecionado, setSelecionado] = useState<{ codigo: string; descricao: string } | null>(null);

  const resultados = useMemo(() => {
    if (tipo === 'NCM') return buscarNcm(termo);
    return buscarNbs(termo);
  }, [termo, tipo]);

  const ficha = selecionado ? montarFicha(selecionado.codigo, selecionado.descricao, tipo) : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">{titulo}</h2>
      <p className="mb-5 text-sm text-slate-500">{subtitulo}</p>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setSelecionado(null);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <p className="mb-4 text-xs text-slate-400">
        Base oficial: tabela {tipo} vigente + tabela de CST/cClassTrib do IBS/CBS (LC 214/2025, redação da LC
        227/2026). A lista de itens com redução carregada cobre os Anexos I, II, III, VII, VIII e IX — para os
        demais anexos a régua de redução é conhecida, mas o item específico pode não estar mapeado ainda.
      </p>

      {!termo.trim() && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <PackageSearch className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Digite um {tipo}, atividade ou palavra-chave para consultar o tratamento tributário.</p>
        </div>
      )}

      {termo.trim() && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Resultados · {resultados.length}</p>
            {resultados.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <PackageSearch className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">Nenhum item encontrado para "{termo}".</p>
              </div>
            )}
            <ul className="max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
              {resultados.map((item) => (
                <li key={item.codigo}>
                  <button
                    onClick={() => setSelecionado(item)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      selecionado?.codigo === item.codigo
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-200 hover:bg-brand-50/40'
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-slate-400">{item.codigo}</span>
                    <p className="text-slate-800">{item.descricao}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {ficha ? (
              <FichaTributaria ficha={ficha} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-400">
                Selecione um resultado à esquerda para ver a ficha tributária completa.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
