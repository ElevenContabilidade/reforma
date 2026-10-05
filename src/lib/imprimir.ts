/**
 * Abre a área `.print-area` numa nova aba já pronta para imprimir/salvar em PDF.
 *
 * Gera a página via Blob (em vez de navegar para a URL do claude.ai), pois
 * dentro do visualizador de Artifacts o navegador costuma bloquear a
 * reabertura da própria origem claude.ai numa nova aba.
 */
export function imprimirAreaImpressao(tituloPagina: string) {
  const printArea = document.querySelector('.print-area');
  if (!printArea) return;

  const clone = printArea.cloneNode(true) as HTMLElement;
  // Remove os elementos de tela (botões, campos etc.) do clone: na nova aba
  // eles seriam apenas HTML estático, sem o React por trás, então cliques
  // neles não fariam nada.
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  const estilos = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');
  const titulo = tituloPagina.replace(/[<>&]/g, '');
  // O disparo do print() fica dentro da própria página gerada (em vez de a
  // aba original chamar novaAba.print()), porque chamar print() de fora da
  // janela costuma ser bloqueado ou simplesmente não disparar de forma
  // confiável entre abas.
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>${estilos}</head><body>${clone.outerHTML}<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
