/**
 * Marca "eleven." — recriação aproximada do ícone (barras diagonais + seta)
 * a partir da logo enviada pelo cliente. Se um arquivo de logo oficial
 * (PNG/SVG) for fornecido depois, substituir este componente pela imagem
 * real garante fidelidade total à marca.
 */
export function EleveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="53" x2="24" y2="38" />
        <line x1="22" y1="53" x2="37" y2="38" />
        <line x1="35" y1="53" x2="55" y2="33" />
        <polyline points="46,33 55,33 55,42" />
      </g>
    </svg>
  );
}

export function EleveLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <EleveIcon className="h-8 w-8 shrink-0 text-gold-200" />
      <div className="leading-none">
        <p className="text-xl font-semibold tracking-tight text-gold-100">
          eleven<span className="text-gold-400">.</span>
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Contabilidade &amp; Consultoria
        </p>
      </div>
    </div>
  );
}
