import express from 'express';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET 
const BOT_TOKEN = process.env.BOT_TOKEN
const PLATFORM_API_URL = 'https://api.agora.fslab.dev';

app.post('/webhook/agora', async (req, res) => {
  console.log('--- NOVO EVENTO RECEBIDO ---');
  console.log('Headers recebidos:', req.headers);
  console.log('Assinatura recebida:', req.headers['x-agora-signature']);
  console.log('Body recebido:', req.body);

  if (req.headers['x-agora-signature'] !== WEBHOOK_SECRET) {
    console.error('Assinatura inválida. Acesso negado.');
    return res.status(403).send('Assinatura inválida');
  }

  // 1. Extrai o conversationId corretamente a partir de dados ou da raiz
  const conversationId = req.body?.dados?.conversationId || req.body?.conversationId;

  if (!conversationId) {
    console.error('conversationId não encontrado no body');
    return res.status(400).send('conversationId ausente');
  }
  if(req.body.dados.senderId === '6a73e92d7237502b187d79ff') {
    console.log('Mensagem enviada pelo bot, ignorando...');
    return res.status(200).send('Mensagem do bot ignorada');
  }

  try {
    // 2. Executa o fetch ANTES de encerrar a requisição com o res.status(200)
    const respostaBot = await fetch(`${PLATFORM_API_URL}/bot/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-token': BOT_TOKEN
      },
      body: JSON.stringify({
        conversationId: conversationId,
        text: 'Bom dia! ☀️ Encaminhando sua mensagem para o suporte. Em breve, um atendente irá te responder! ⏳'
      })
    });

    const statusBot = respostaBot.status;
    const corpoBot = await respostaBot.text();
    console.log(`Resposta do Bot Ágora [Status ${statusBot}]:`, corpoBot);

    // 3. Responde com sucesso para o webhook do Ágora
    return res.status(200).send('OK');

  } catch (err) {
    console.error('Erro ao disparar mensagem do bot:', err);
    return res.status(500).send('Erro interno ao disparar bot');
  }
});

app.listen(5500, () => {
  console.log('Servidor rodando na porta 5500');
});