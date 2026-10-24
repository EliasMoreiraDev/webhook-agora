import express from 'express';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PLATFORM_API_URL = process.env.PLATFORM_API_URL || 'https://api.agora.fslab.dev';
const MEU_USER_ID = process.env.MEU_USER_ID || '6a73e92d7237502b187d79ff';

const RESPOSTA_BOT = 'Bom dia! ☀️ Encaminhando sua mensagem para o suporte. Em breve, um atendente irá te responder! ⏳';

// Rota para testar se o servidor está ativo
app.get('/', (req, res) => {
  res.send('Servidor do webhook ativo');
});

// Endpoint do webhook (aceita /webhook/agora e /)
app.post(['/webhook/agora', '/'], async (req, res) => {
  const signature = req.headers['x-agora-signature'];
  if (WEBHOOK_SECRET && signature !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Assinatura inválida no X-Agora-Signature' });
  }

  const dados = req.body?.dados;
  const conversationId = dados?.conversationId || req.body?.conversationId;
  const senderId = dados?.senderId;
  const texto = dados?.text;

  if (!conversationId) {
    return res.status(400).send('conversationId ausente');
  }

  // 1. Evita loop: ignora mensagem enviada pelo dono do bot
  if (senderId === MEU_USER_ID) {
    return res.status(200).send('Mensagem do dono do bot ignorada');
  }

  // 2. Evita loop: ignora se a mensagem for a própria resposta do bot
  if (texto === RESPOSTA_BOT) {
    return res.status(200).send('Mensagem do próprio bot ignorada');
  }

  try {
    const urlDestino = `${PLATFORM_API_URL.replace(/\/$/, '')}/bot/messages`;
    const response = await fetch(urlDestino, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-token': BOT_TOKEN
      },
      body: JSON.stringify({
        conversationId: conversationId,
        text: RESPOSTA_BOT
      })
    });

    const respostaTexto = await response.text();

    if (!response.ok) {
      console.error(`Erro da API do Ágora (${response.status}):`, respostaTexto);
      return res.status(response.status).send(`Erro do Ágora: ${respostaTexto}`);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao disparar mensagem do bot:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;

export default app;