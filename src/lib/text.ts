/** Remove acentos e coloca em minúsculas, para comparação/busca tolerante. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
