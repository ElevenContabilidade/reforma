/**
 * Marca "eleven." — ícone vetorizado a partir do arquivo oficial enviado pela
 * cliente (3 barras diagonais formando uma seta ascendente), com fidelidade
 * total ao traçado original.
 */
const ICONE_PATHS = [
  'M219,0 L0,218 L42,260 L261,42 Z',
  'M427,6 L311,41 L331,62 L88,305 L216,434 L261,393 L173,305 L375,103 L398,124 Z',
  'M394,175 L262,306 L304,348 L436,217 Z',
];

let idSeq = 0;

export function EleveIcon({ className, variant = 'gold' }: { className?: string; variant?: 'gold' | 'brand' }) {
  const gradientId = `eleve-icon-grad-${variant}-${++idSeq}`;
  const stops =
    variant === 'gold'
      ? (['#fbf1d7', '#f6dfa1', '#c9922b'] as const)
      : (['#8c2426', '#6b1013', '#290608'] as const);

  return (
    <svg viewBox="0 0 437 435" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={stops[2]} />
          <stop offset="50%" stopColor={stops[0]} />
          <stop offset="100%" stopColor={stops[2]} />
        </linearGradient>
      </defs>
      {ICONE_PATHS.map((d) => (
        <path key={d} d={d} fill={`url(#${gradientId})`} />
      ))}
    </svg>
  );
}

export function EleveLogo({ className, variant = 'gold' }: { className?: string; variant?: 'gold' | 'brand' }) {
  const corTexto = variant === 'gold' ? 'text-gold-100' : 'text-brand-900';
  const corPonto = variant === 'gold' ? 'text-gold-400' : 'text-brand-500';
  const corTagline = variant === 'gold' ? 'text-stone-400' : 'text-brand-600';

  return (
    <div className={`flex flex-col items-center text-center ${className ?? ''}`}>
      <EleveIcon variant={variant} className="h-14 w-14 shrink-0" />
      <p className={`mt-2 text-2xl font-semibold leading-none tracking-tight ${corTexto}`}>
        eleven<span className={corPonto}>.</span>
      </p>
      <p className={`mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${corTagline}`}>
        Contabilidade &amp; Consultoria
      </p>
    </div>
  );
}
