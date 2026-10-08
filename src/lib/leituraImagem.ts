import type { GuiaMensal, StatusPagamento } from './types';
import { descricaoComposicao, rotuloCodigo } from './guias';

/** Função `sample` do runtime de Artifacts (pedir ao Claude). Ausente fora do link publicado. */
type Sample = {
  json: <T>(input: string, options?: { images?: Blob[]; modelTier?: 'quick' | 'default' | 'complex' }) => Promise<T>;
  limits: () => Promise<{ images?: { maxCount: number } }>;
};

interface ItemLido {
  tributo?: string;
  codigoReceita?: string;
  competencia?: string; // MM/AAAA
  vencimento?: string; // DD/MM/AAAA
  valor?: number;
  situacao?: string;
}

interface RespostaLeitura {
  cnpj?: string;
  razaoSocial?: string;
  itens?: ItemLido[];
}

const PROMPT = `Você vai ler prints de telas e guias fiscais brasileiras de uma empresa (ex.: tela "Dívida DCTFWeb" do e-CAC, consulta de débitos, DARF, guia do FGTS Digital, Situação Fiscal).
Extraia cada débito ou guia que aparece, um item por linha da tabela.
Responda SOMENTE com JSON neste formato:
{"cnpj":"00.000.000/0000-00 ou vazio","razaoSocial":"nome ou vazio","itens":[{"tributo":"INSS|IRRF|FGTS|outro (texto curto)","codigoReceita":"ex.: 1099 (só os 4 dígitos) ou vazio","competencia":"MM/AAAA","vencimento":"DD/MM/AAAA","valor":356.62,"situacao":"a vencer|em aberto|pago"}]}
Regras: valor é número com ponto decimal (o saldo devedor ou valor a pagar). Competência = período de apuração. Não invente: se um campo não aparece, deixe vazio. Se não houver débitos, devolva "itens": [].`;

function dataIso(br?: string): string | undefined {
  const m = br?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

function statusDe(situacao?: string): StatusPagamento {
  const s = (situacao ?? '').toLowerCase();
  if (s.includes('pago') || s.includes('liquidad') || s.includes('quitad')) return 'pago';
  if (s.includes('aberto') || s.includes('devedor') || s.includes('vencid')) return 'aberto';
  return 'nao-informado';
}

/** Mensagem para o usuário a partir do código de erro do `sample`. */
function mensagemErro(code?: string): string {
  switch (code) {
    case 'not_granted':
      return 'A leitura de imagem precisa da sua autorização para usar o Claude. Recarregue a página e permita quando for pedido.';
    case 'rate_limited':
      return 'Muitas leituras seguidas ou limite de uso atingido. Aguarde um pouco e tente de novo.';
    case 'image_rejected':
      return 'A imagem não pôde ser lida (formato ou tamanho). Use PNG ou JPG.';
    case 'invalid_json':
    case 'empty_completion':
      return 'Não consegui identificar débitos nessa imagem. Tente um print mais nítido, só da tabela.';
    case 'images_unavailable':
    case 'sampling_disabled':
    case 'capability_disabled':
      return 'Leitura de imagem indisponível nesta visualização. Use o formulário manual.';
    default:
      return 'Falha ao ler a imagem. Tente de novo em instantes ou use o formulário manual.';
  }
}

export async function leituraImagemDisponivel(): Promise<boolean> {
  const sample = (await (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude?.use('sample')) as Sample | null | undefined;
  if (!sample) return false;
  const limites = await sample.limits().catch(() => null);
  return Boolean(limites?.images);
}

/**
 * Lê prints (tela da DCTFWeb, FGTS Digital etc.) pedindo ao Claude, no link
 * publicado, para extrair os débitos. Itens da DCTFWeb com a mesma
 * competência e vencimento viram uma guia só, com a composição por código.
 */
export async function lerImagensDeGuias(
  imagens: File[],
  padrao: { cnpj?: string; razaoSocial?: string },
): Promise<{ guias: GuiaMensal[]; aviso?: string }> {
  const sample = (await (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude?.use('sample')) as Sample | null | undefined;
  if (!sample) return { guias: [], aviso: 'A leitura de imagem só funciona no link publicado do relatório. Use o formulário manual.' };

  let resposta: RespostaLeitura;
  try {
    resposta = await sample.json<RespostaLeitura>(PROMPT, { images: imagens, modelTier: 'default' });
  } catch (e) {
    return { guias: [], aviso: mensagemErro((e as { code?: string })?.code) };
  }

  const cnpj = resposta.cnpj?.trim() || padrao.cnpj || '';
  const razaoSocial = resposta.razaoSocial?.trim() || padrao.razaoSocial || '';
  if (!cnpj) return { guias: [], aviso: 'O CNPJ não aparece no print. Selecione a empresa no painel e envie a imagem de novo.' };

  const itens = (resposta.itens ?? []).filter(
    (i) => /^\d{2}\/\d{4}$/.test(i.competencia ?? '') && dataIso(i.vencimento) && Number(i.valor) > 0,
  );
  if (itens.length === 0) return { guias: [], aviso: 'Nenhum débito identificado na imagem.' };

  const grupos = new Map<string, ItemLido[]>();
  for (const i of itens) {
    const fgts = /FGTS/i.test(i.tributo ?? '');
    const chave = `${fgts ? 'fgts' : 'dctfweb'}|${i.competencia}|${i.vencimento}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), i]);
  }

  const guias: GuiaMensal[] = [...grupos.entries()].map(([chave, lista]) => {
    const [tipo, competencia] = chave.split('|') as ['fgts' | 'dctfweb', string];
    const composicao = lista.map((i) => {
      const codigo = (i.codigoReceita ?? '').replace(/\D/g, '').slice(0, 4) || (tipo === 'fgts' ? 'FGTS' : '');
      const valor = Number(i.valor);
      const denominacao = tipo === 'fgts' ? 'FGTS mensal' : rotuloCodigo(codigo, i.tributo ?? '');
      return { codigo, denominacao, valor };
    });
    const valor = Math.round(composicao.reduce((t, c) => t + c.valor, 0) * 100) / 100;
    const status = lista.every((i) => statusDe(i.situacao) === 'pago') ? 'pago' : lista.some((i) => statusDe(i.situacao) === 'aberto') ? 'aberto' : 'nao-informado';
    return {
      id: `img-${tipo}-${competencia}-${composicao.map((c) => c.codigo).sort().join('-')}`,
      tipo,
      cnpj,
      razaoSocial,
      descricao: tipo === 'fgts' ? 'FGTS' : descricaoComposicao(composicao),
      competencia,
      vencimento: dataIso(lista[0].vencimento)!,
      valor,
      composicao,
      status,
    };
  });
  return { guias };
}
