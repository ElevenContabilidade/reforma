/**
 * Abre a área `.print-area` numa nova aba já pronta para imprimir/salvar em PDF.
 *
 * Gera a página via Blob (em vez de navegar para a URL do claude.ai), pois
 * dentro do visualizador de Artifacts o navegador costuma bloquear a
 * reabertura da própria origem claude.ai numa nova aba.
 */
// Ajusta a área impressa para caber numa única folha A4 (margens de 10 mm):
// mede a altura no layout de impressão (.modo-impressao) e aplica zoom,
// alargando a área na mesma proporção para continuar ocupando a largura toda.
const SCRIPT_UMA_PAGINA = `
  function caberEmUmaPagina() {
    var area = document.querySelector('.print-area');
    if (!area) return;
    var largura = 718, altura = 1040; // 190 x 277 mm a 96 dpi, com folga
    var zoom = 1;
    for (var i = 0; i < 5; i++) {
      area.style.width = (largura / zoom) + 'px';
      var novo = Math.min(1, altura / area.scrollHeight);
      if (Math.abs(novo - zoom) < 0.003) { zoom = novo; break; }
      zoom = novo;
    }
    area.style.width = (largura / zoom) + 'px';
    area.style.zoom = zoom;
  }
`;

export function imprimirAreaImpressao(tituloPagina: string, opcoes: { umaPagina?: boolean } = {}) {
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
  const umaPagina = opcoes.umaPagina
    ? `<style>body{margin:0}@page{size:A4;margin:10mm}</style>`
    : '';
  const ajuste = opcoes.umaPagina ? `${SCRIPT_UMA_PAGINA} caberEmUmaPagina();` : '';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>${estilos}${umaPagina}</head><body class="${opcoes.umaPagina ? 'modo-impressao' : ''}">${clone.outerHTML}<script>window.addEventListener('load', function () { ${ajuste} setTimeout(function () { window.print(); }, 250); });</script></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
