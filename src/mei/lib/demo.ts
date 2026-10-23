import type { BaseMei, CategoriaDespesa, CategoriaReceita, ClienteMei, Lancamento } from './types';
import { competenciasDoAno, round2 } from './regras';
import { baseVazia } from './base';

interface PerfilDemo {
  cliente: Omit<ClienteMei, 'criadoEm' | 'ativo' | 'observacoes' | 'email'>;
  receitaMensal: number;
  receitas: { descricao: string; categoria: CategoriaReceita; pj: boolean; peso: number }[];
  despesas: { descricao: string; categoria: CategoriaDespesa; valor: number }[];
  /** Quantas das últimas competências ficam sem pagamento informado. */
  dasEmAberto: number;
}

/** Gera uma carteira fictícia com movimento do ano corrente, relativo à data de hoje. */
export function gerarBaseDemo(hoje = new Date()): BaseMei {
  const ano = hoje.getFullYear();
  const perfis: PerfilDemo[] = [
    {
      cliente: {
        id: 'cli_demo_maria',
        nome: 'MARIA DE FATIMA SOUSA 01234567890',
        nomeFantasia: 'Doces da Fátima',
        cnpj: '45.123.456/0001-10',
        atividade: 'comercio',
        descricaoAtividade: 'Fabricação de produtos de padaria e confeitaria (1091-1/02)',
        dataAbertura: '2021-04-12',
        temFuncionario: false,
        whatsapp: '85988887777',
        codigoAcesso: 'DOCE85',
      },
      receitaMensal: 4800,
      receitas: [
        { descricao: 'Vendas de bolos e doces no balcão', categoria: 'industrializacao', pj: false, peso: 0.7 },
        { descricao: 'Encomenda de coffee break', categoria: 'industrializacao', pj: true, peso: 0.3 },
      ],
      despesas: [
        { descricao: 'Compra de insumos (farinha, açúcar, ovos)', categoria: 'mercadorias', valor: 1500 },
        { descricao: 'Conta de energia', categoria: 'contas_consumo', valor: 260 },
      ],
      dasEmAberto: 0,
    },
    {
      cliente: {
        id: 'cli_demo_joao',
        nome: 'JOAO PAULO LIMA 98765432100',
        nomeFantasia: 'JP Instalações Elétricas',
        cnpj: '38.765.432/0001-55',
        atividade: 'servicos',
        descricaoAtividade: 'Instalação e manutenção elétrica (4321-5/00)',
        dataAbertura: '2019-08-01',
        temFuncionario: true,
        whatsapp: '85999996666',
        codigoAcesso: 'JPLUZ1',
      },
      receitaMensal: 7600,
      receitas: [
        { descricao: 'Serviço elétrico residencial', categoria: 'servico', pj: false, peso: 0.45 },
        { descricao: 'Manutenção predial - condomínio', categoria: 'servico', pj: true, peso: 0.55 },
      ],
      despesas: [
        { descricao: 'Material elétrico', categoria: 'material', valor: 900 },
        { descricao: 'Salário do ajudante', categoria: 'funcionario', valor: 1800 },
      ],
      dasEmAberto: 2,
    },
    {
      cliente: {
        id: 'cli_demo_ana',
        nome: 'ANA CAROLINA ROCHA 11122233344',
        nomeFantasia: 'Studio Ana Rocha',
        cnpj: '58.222.333/0001-90',
        atividade: 'comercio_servicos',
        descricaoAtividade: 'Cabeleireiros, manicure e pedicure (9602-5/01) + comércio de cosméticos',
        dataAbertura: `${ano}-03-05`,
        temFuncionario: false,
        whatsapp: '85977775555',
        codigoAcesso: 'ANA2026',
      },
      receitaMensal: 3900,
      receitas: [
        { descricao: 'Atendimentos do salão', categoria: 'servico', pj: false, peso: 0.8 },
        { descricao: 'Venda de cosméticos', categoria: 'revenda', pj: false, peso: 0.2 },
      ],
      despesas: [
        { descricao: 'Aluguel da sala', categoria: 'aluguel', valor: 800 },
        { descricao: 'Produtos para revenda', categoria: 'mercadorias', valor: 450 },
      ],
      dasEmAberto: 1,
    },
    {
      cliente: {
        id: 'cli_demo_carlos',
        nome: 'CARLOS ALBERTO NUNES 55566677788',
        nomeFantasia: 'Nunes Fretes',
        cnpj: '41.555.666/0001-22',
        atividade: 'caminhoneiro',
        descricaoAtividade: 'Transporte rodoviário de carga municipal (4930-2/01)',
        dataAbertura: '2022-02-10',
        temFuncionario: false,
        whatsapp: '85966664444',
        codigoAcesso: 'FRETE8',
      },
      receitaMensal: 14500,
      receitas: [{ descricao: 'Frete para distribuidora', categoria: 'servico', pj: true, peso: 1 }],
      despesas: [
        { descricao: 'Diesel', categoria: 'outras', valor: 5200 },
        { descricao: 'Manutenção do caminhão', categoria: 'servicos_terceiros', valor: 1100 },
      ],
      dasEmAberto: 0,
    },
  ];

  const base = baseVazia();
  base.config.whatsappEscritorio = '85900000000';
  const criadoEm = new Date().toISOString();
  let seq = 0;

  for (const p of perfis) {
    base.clientes.push({ ...p.cliente, email: '', ativo: true, observacoes: '', criadoEm });
    const comps = competenciasDoAno(p.cliente, ano, hoje);

    comps.forEach((comp, i) => {
      // Variação determinística (+-15%) para o gráfico não ficar reto.
      const fator = 0.85 + ((i * 37 + p.cliente.id.length * 11) % 31) / 100;
      const ehMesAtual = i === comps.length - 1;
      const proporcao = ehMesAtual ? Math.min(1, hoje.getDate() / 30) : 1;
      const dia = (n: number) => `${comp}-${String(Math.min(n, ehMesAtual ? hoje.getDate() : 28)).padStart(2, '0')}`;

      p.receitas.forEach((r, j) => {
        const valor = round2(p.receitaMensal * r.peso * fator * proporcao);
        if (valor <= 0) return;
        base.lancamentos.push(
          lanc(++seq, p.cliente.id, 'receita', dia(5 + j * 9), r.descricao, valor, r.categoria, {
            // Um lançamento para PJ sem nota no mês atual, para demonstrar o alerta.
            comNota: r.pj ? !(ehMesAtual && p.cliente.id === 'cli_demo_joao') : i % 3 === 0,
            tomadorPj: r.pj,
          }),
        );
      });
      p.despesas.forEach((d, j) => {
        base.lancamentos.push(
          lanc(++seq, p.cliente.id, 'despesa', dia(8 + j * 6), d.descricao, round2(d.valor * proporcao), d.categoria, {
            comNota: true,
            tomadorPj: false,
          }),
        );
      });

      // DAS da competência só existe a partir do mês seguinte; o mês corrente ainda não venceu.
      if (!ehMesAtual && i < comps.length - 1 - p.dasEmAberto) {
        base.das.push({ clienteId: p.cliente.id, competencia: comp, pago: true, pagoEm: criadoEm, informadoPor: 'cliente' });
      }
    });

    if (p.cliente.dataAbertura.slice(0, 4) < String(ano)) {
      base.dasn.push({
        clienteId: p.cliente.id,
        anoBase: ano - 1,
        entregue: p.cliente.id !== 'cli_demo_joao',
        entregueEm: criadoEm,
      });
    }
  }

  base.mensagens.push(
    {
      id: 'msg_demo_1',
      clienteId: 'cli_demo_joao',
      de: 'cliente',
      assunto: 'emitir_nota',
      texto: 'Preciso emitir a nota do condomínio deste mês, pode me ajudar no emissor nacional?',
      criadoEm,
      lida: false,
      resolvida: false,
    },
    {
      id: 'msg_demo_2',
      clienteId: 'cli_demo_ana',
      de: 'escritorio',
      assunto: 'aviso',
      texto: 'Ana, lembre de lançar todas as vendas de cosméticos separadas dos serviços. Isso muda o relatório mensal.',
      criadoEm,
      lida: false,
      resolvida: false,
    },
  );

  return base;
}

function lanc(
  seq: number,
  clienteId: string,
  tipo: Lancamento['tipo'],
  data: string,
  descricao: string,
  valor: number,
  categoria: Lancamento['categoria'],
  extra: Pick<Lancamento, 'comNota' | 'tomadorPj'>,
): Lancamento {
  return {
    id: `lan_demo_${seq}`,
    clienteId,
    tipo,
    data,
    descricao,
    valor,
    categoria,
    origem: 'cliente',
    criadoEm: new Date().toISOString(),
    ...extra,
  };
}
