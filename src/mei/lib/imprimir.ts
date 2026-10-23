/**
 * Abre o conteúdo de `seletor` numa aba própria (via Blob) e dispara a
 * impressão de lá. Mesma abordagem do Dashboard do simulador: dentro do
 * visualizador de Artifacts, imprimir a própria página não é confiável.
 */
export function imprimirArea(seletor: string, titulo: string) {
  const area = document.querySelector(seletor);
  if (!area) return;
  const clone = area.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());
  const estilos = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');
  const tituloSeguro = titulo.replace(/[<>&]/g, '');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${tituloSeguro}</title>${estilos}</head><body style="padding:24px">${clone.outerHTML}<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(url, '_blank');
}
