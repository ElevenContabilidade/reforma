export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarPercentual(valor: number, casasDecimais = 2): string {
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais })}%`;
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR');
}
