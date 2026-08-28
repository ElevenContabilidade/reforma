import { useMemo, useState } from 'react';
import { Search, PackageSearch } from 'lucide-react';
import type { ClassificacaoItem } from '../lib/ncmData';
import { categoriaPorId, classesReducaoBadge } from '../lib/reform';
import { normalizar } from '../lib/text';

interface Props {
  titulo: string;
  subtitulo: string;
  placeholder: string;
  itens: ClassificacaoItem[];
  rotuloCodigo: string;
}

export function ConsultaClassificacao({ titulo, subtitulo, placeholder, itens, rotuloCodigo }: Props) {
  const [termo, setTermo] = useState('');

  const resultados = useMemo(() => {
    const termoNorm = normalizar(termo.trim());
    if (!termoNorm) return [];
    return itens.filter(
      (item) =>
        normalizar(item.codigo).includes(termoNorm) ||
        normalizar(item.descricao).includes(termoNorm) ||
        (item.apelidos ?? []).some((apelido) => normalizar(apelido).includes(termoNorm)),
    );
  }, [termo, itens]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">{titulo}</h2>
      <p className="mb-5 text-sm text-slate-500">{subtitulo}</p>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <p className="mb-4 text-xs text-slate-400">
        Base de consulta curada com os itens mais comuns — não substitui a lista oficial completa dos anexos da LC
        214/2025. Em caso de dúvida sobre um item específico, confirme o enquadramento na legislação vigente.
      </p>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">
          Resultados {termo.trim() && <span className="text-slate-400">· {resultados.length} encontrado(s)</span>}
        </p>

        {!termo.trim() && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <PackageSearch className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Digite um termo para consultar o tratamento tributário na Reforma.</p>
          </div>
        )}

        {termo.trim() && resultados.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <PackageSearch className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Nenhum item encontrado para "{termo}" na base curada.</p>
          </div>
        )}

        <ul className="space-y-2">
          {resultados.map((item) => {
            const cat = categoriaPorId(item.categoria);
            return (
              <li key={`${item.codigo}-${item.descricao}`} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {rotuloCodigo} {item.codigo}
                    </span>
                    <p className="font-medium text-slate-900">{item.descricao}</p>
                    {item.observacao && <p className="mt-1 text-xs text-slate-500">{item.observacao}</p>}
                  </div>
                  {cat && (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${classesReducaoBadge(cat.reducaoPercentual)}`}>
                      {cat.reducaoPercentual > 0 ? `−${cat.reducaoPercentual}% na alíquota` : 'alíquota cheia'}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
