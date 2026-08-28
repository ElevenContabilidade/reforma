import { FileText, ExternalLink, Info } from 'lucide-react';
import type { FichaTributaria as FichaTributariaData } from '../lib/officialData';
import { anexoRomano, indopSugeridos, cnaesRelacionados } from '../lib/officialData';
import { classesReducaoBadge } from '../lib/reform';
import { formatarPercentual } from '../lib/format';

function formatarData(data: string | null): string {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function CampoFicha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-stone-800">{children}</dd>
    </div>
  );
}

export function FichaTributaria({ ficha }: { ficha: FichaTributariaData }) {
  const { classificacao, itemAnexo, codigo, descricao, tipo } = ficha;
  const reducaoMaxima = Math.max(classificacao.pRedIBS, classificacao.pRedCBS);
  const indops = indopSugeridos(tipo);
  const cnaes = tipo === 'NBS' ? cnaesRelacionados(codigo) : [];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <span className="font-mono text-xs font-semibold text-stone-400">
            {tipo} {codigo}
          </span>
          <p className="font-medium text-stone-900">{descricao}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${classesReducaoBadge(reducaoMaxima)}`}>
          {reducaoMaxima > 0 ? `−${reducaoMaxima}% na alíquota` : 'alíquota cheia'}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <CampoFicha label="CST-IBS/CBS">{classificacao.cst}</CampoFicha>
        <CampoFicha label="Descrição CST">{classificacao.cstDescricao}</CampoFicha>
        <CampoFicha label="cClassTrib">{classificacao.cClassTrib}</CampoFicha>
        <CampoFicha label="Redução IBS">{formatarPercentual(classificacao.pRedIBS, 0)}</CampoFicha>
        <CampoFicha label="Redução CBS">{formatarPercentual(classificacao.pRedCBS, 0)}</CampoFicha>
        <CampoFicha label="Tipo de alíquota">{classificacao.tipoAliquota ?? '—'}</CampoFicha>
        <CampoFicha label="Vigência">
          {formatarData(classificacao.dIniVig)} até {classificacao.dFimVig ? formatarData(classificacao.dFimVig) : 'atual'}
        </CampoFicha>
        <CampoFicha label={`ITEM DO ANEXO (${tipo})`}>
          {itemAnexo
            ? `Anexo ${anexoRomano(itemAnexo.anexo)}, item ${itemAnexo.item}`
            : ficha.profissaoRegulada
              ? `Profissão regulamentada (art. 127): ${ficha.profissaoRegulada.profissao}`
              : 'Não consta em anexo de redução — alíquota padrão'}
        </CampoFicha>
        <CampoFicha label="Base legal">
          {classificacao.link ? (
            <a
              href={classificacao.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              {classificacao.baseLegalTexto ?? 'LC 214/2025'}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            (classificacao.baseLegalTexto ?? '—')
          )}
        </CampoFicha>
      </dl>

      <div className="mt-4 border-t border-stone-100 pt-4">
        <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">Documentos fiscais aceitos</dt>
        <div className="flex flex-wrap gap-1.5">
          {classificacao.documentosAceitos.length > 0 ? (
            classificacao.documentosAceitos.map((doc) => (
              <span key={doc} className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">
                <FileText className="h-3 w-3" />
                {doc}
              </span>
            ))
          ) : (
            <span className="text-sm text-stone-400">—</span>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">{classificacao.descricao}</p>

      {cnaes.length > 0 && (
        <details className="mt-4 border-t border-stone-100 pt-4" open>
          <summary className="cursor-pointer text-sm font-medium text-stone-700">
            CNAEs relacionados ({cnaes.length})
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {cnaes.map((c) => (
              <li
                key={c.codigo}
                title={c.descricao}
                className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600"
              >
                <span className="font-mono font-semibold text-stone-500">{c.codigo}</span>
                <span className="max-w-[16rem] truncate">{c.descricao}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {indops.length > 0 && (
        <details className="mt-4 border-t border-stone-100 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-stone-700">
            INDOP (indicador de operação) possivelmente aplicável ({indops.length})
          </summary>
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>O INDOP correto depende de como a operação é realizada (local de entrega, presencial ou não etc.) — confirme o cenário do cliente.</span>
          </div>
          <ul className="mt-2 space-y-2">
            {indops.map((i) => (
              <li key={i.codigo} className="rounded-lg border border-stone-200 p-3 text-xs">
                <span className="font-mono font-semibold text-stone-400">{i.codigo}</span>
                <p className="font-medium text-stone-800">{i.caracteristica}</p>
                <p className="mt-1 text-stone-500">Local do fornecimento: {i.local}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
