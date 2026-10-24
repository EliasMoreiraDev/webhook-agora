import express from 'express';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
const BOT_TOKEN = process.env.BOT_TOKEN 
const PLATFORM_API_URL = process.env.PLATFORM_API_URL || 'https://api.agora.fslab.dev';
const MEU_USER_ID = process.env.MEU_USER_ID || '6a73e92d7237502b187d79ff';

app.post('/webhook/agora', async (req, res) => {
  const signature = req.headers['x-agora-signature'];
  if (signature !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Assinatura inválida no X-Agora-Signature' });
  }

  const dados = req.body?.dados;
  const conversationId = dados?.conversationId || req.body?.conversationId;
  const senderId = dados?.senderId;

  if (!conversationId) {
    return res.status(400).send('conversationId ausente');
  }

  if (senderId === MEU_USER_ID) {
    return res.status(200).send('Mensagem do dono do bot ignorada');
  }

  try {
    const response = await fetch(`${PLATFORM_API_URL}/bot/messages`, {
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

    await response.text();
    return res.status(200).send('OK');
  } catch (error) {
    return res.status(500).send('Erro interno ao disparar bot');
  }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {});