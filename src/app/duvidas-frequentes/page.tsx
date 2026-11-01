import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dúvidas Frequentes (FAQ)' };

const FAQS = [
  {
    q: 'Preciso pagar online para criar meu pedido?',
    a: 'Não! Você seleciona seus produtos e numerações no site, gera o número oficial do pedido com estoque reservado e combina o pagamento (Pix, cartão ou dinheiro) diretamente com nossa equipe.',
  },
  {
    q: 'O estoque das numerações é em tempo real?',
    a: 'Sim. Cada cor e tamanho possui controle individualizado de estoque. Se uma numeração estiver visível e selecionável, ela está disponível para reserva imediata.',
  },
  {
    q: 'Posso retirar meu pedido pessoalmente na loja?',
    a: 'Com certeza! No checkout você pode escolher "Retirar na loja" sem custo de entrega. Assim que o status mudar para "Pronto para retirada", seu par já estará separado esperando por você.',
  },
  {
    q: 'E se a numeração não servir?',
    a: 'Você conta com até 7 dias corridos após o recebimento para solicitar a troca por outra numeração ou modelo disponível, bastando manter o calçado sem sinais de uso e na caixa original.',
  },
// step 2/5
