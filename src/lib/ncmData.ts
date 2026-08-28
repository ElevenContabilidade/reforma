import type { CategoriaReducao } from './types';

export interface ClassificacaoItem {
  codigo: string;
  descricao: string;
  categoria: CategoriaReducao;
  observacao?: string;
  /** Termos alternativos de busca (sinônimos comuns que não aparecem na descrição). */
  apelidos?: string[];
}

/**
 * Referência rápida de classificação de produtos (NCM) para fins de CBS/IBS,
 * com base nos anexos da LC 214/2025. Cobre os itens mais comuns por
 * categoria de redução — não é a lista oficial completa (que soma milhares
 * de códigos NCM); para o enquadramento definitivo de um produto específico,
 * consulte o Anexo correspondente da lei ou a classificação fiscal (cClassTrib)
 * já adotada na nota fiscal.
 */
export const NCM_ITENS: ClassificacaoItem[] = [
  // Cesta básica nacional de alimentos — alíquota zero (Anexo I)
  { codigo: '1006', descricao: 'Arroz', categoria: 'cesta-basica' },
  { codigo: '0713', descricao: 'Feijão e outros legumes secos', categoria: 'cesta-basica' },
  { codigo: '0401', descricao: 'Leite fluido (in natura, pasteurizado, UHT)', categoria: 'cesta-basica', apelidos: ['leite'] },
  { codigo: '0402', descricao: 'Leite em pó', categoria: 'cesta-basica' },
  { codigo: '1101', descricao: 'Farinha de trigo', categoria: 'cesta-basica' },
  { codigo: '1102', descricao: 'Farinha de mandioca e de milho', categoria: 'cesta-basica' },
  { codigo: '0407', descricao: 'Ovos frescos', categoria: 'cesta-basica', apelidos: ['ovo'] },
  { codigo: '0201/0202', descricao: 'Carne bovina in natura', categoria: 'cesta-basica', apelidos: ['carne', 'boi'] },
  { codigo: '0203', descricao: 'Carne suína in natura', categoria: 'cesta-basica', apelidos: ['porco'] },
  { codigo: '0207', descricao: 'Carne de frango in natura', categoria: 'cesta-basica', apelidos: ['frango', 'galinha'] },
  { codigo: '0302/0303/0304', descricao: 'Peixes in natura ou congelados', categoria: 'cesta-basica', apelidos: ['peixe'] },
  { codigo: '0901', descricao: 'Café (grão, moído ou solúvel)', categoria: 'cesta-basica', apelidos: ['café'] },
  { codigo: '1701', descricao: 'Açúcar', categoria: 'cesta-basica' },
  { codigo: '2501', descricao: 'Sal de cozinha', categoria: 'cesta-basica' },
  { codigo: '1507/1512/1514', descricao: 'Óleos vegetais comestíveis (soja, girassol, canola)', categoria: 'cesta-basica' },
  { codigo: '1902', descricao: 'Massas alimentícias (macarrão)', categoria: 'cesta-basica' },
  { codigo: '1905', descricao: 'Pão comum', categoria: 'cesta-basica' },
  { codigo: '0701–0714', descricao: 'Hortícolas, tubérculos e raízes (batata, mandioca, cebola)', categoria: 'cesta-basica' },
  { codigo: '0803–0810', descricao: 'Frutas frescas', categoria: 'cesta-basica' },

  // Outras isenções específicas (Anexo I / hipóteses específicas)
  {
    codigo: '3003/3004',
    descricao: 'Medicamentos de alíquota zero (lista Farmácia Popular, oncológicos)',
    categoria: 'isenta100',
    observacao: 'Somente a lista específica prevista em lei — demais medicamentos têm redução de 60%.',
    apelidos: ['remédio'],
  },
  { codigo: '9619', descricao: 'Absorventes higiênicos e itens de higiene menstrual', categoria: 'isenta100' },
  {
    codigo: '4901',
    descricao: 'Livros, jornais e periódicos',
    categoria: 'isenta100',
    observacao: 'Imunidade constitucional (art. 150, VI, "d", CF) — tratamento equivalente à alíquota zero.',
  },
  { codigo: '9021', descricao: 'Próteses e órteses de uso médico', categoria: 'isenta100' },

  // Redução de 60% (Anexo II — saúde, dispositivos médicos, higiene, insumos agropecuários)
  {
    codigo: '3003/3004',
    descricao: 'Medicamentos em geral (registro ANVISA, fora da lista de alíquota zero)',
    categoria: 'reduzida60',
    apelidos: ['remédio'],
  },
  { codigo: '9018', descricao: 'Instrumentos e aparelhos médico-cirúrgicos', categoria: 'reduzida60' },
  { codigo: '9019', descricao: 'Aparelhos de fisioterapia e mecanoterapia', categoria: 'reduzida60' },
  { codigo: '9022', descricao: 'Aparelhos de raio-x e uso médico por radiação', categoria: 'reduzida60' },
  { codigo: '3401', descricao: 'Sabonetes e produtos de higiene pessoal básica', categoria: 'reduzida60' },
  { codigo: '3306', descricao: 'Produtos de higiene bucal', categoria: 'reduzida60' },
  { codigo: '4818', descricao: 'Papel higiênico', categoria: 'reduzida60' },
  { codigo: '3101–3105', descricao: 'Fertilizantes e insumos agropecuários', categoria: 'reduzida60' },
  { codigo: '3808', descricao: 'Defensivos agrícolas registrados', categoria: 'reduzida60' },
  { codigo: '0106/2309', descricao: 'Rações e insumos para produção animal', categoria: 'reduzida60' },
  { codigo: '8201/8432', descricao: 'Máquinas e implementos agrícolas', categoria: 'reduzida60' },
  { codigo: '4903', descricao: 'Álbuns e livros de figuras/desenhos para crianças', categoria: 'reduzida60' },

  // Alíquota padrão (demais produtos)
  { codigo: '8517', descricao: 'Telefones celulares e smartphones', categoria: 'padrao', apelidos: ['celular'] },
  { codigo: '8471', descricao: 'Computadores e notebooks', categoria: 'padrao', apelidos: ['computador'] },
  { codigo: '6109', descricao: 'Camisetas e vestuário em geral', categoria: 'padrao', apelidos: ['roupa'] },
  { codigo: '8703', descricao: 'Automóveis de passageiros', categoria: 'padrao', observacao: 'Também sujeito ao Imposto Seletivo (IS) conforme o modelo/motorização.' },
  { codigo: '2203', descricao: 'Cerveja', categoria: 'padrao', observacao: 'Também sujeito ao Imposto Seletivo (IS) por ser bebida alcoólica.' },
  { codigo: '2402', descricao: 'Cigarros e produtos de tabaco', categoria: 'padrao', observacao: 'Também sujeito ao Imposto Seletivo (IS), com alíquota elevada.' },
  { codigo: '3304', descricao: 'Cosméticos e produtos de beleza', categoria: 'padrao' },
  { codigo: '9503', descricao: 'Brinquedos', categoria: 'padrao' },
  { codigo: '7113', descricao: 'Joias e bijuterias', categoria: 'padrao' },
  { codigo: '8528', descricao: 'Televisores e monitores', categoria: 'padrao' },
];
