import express from 'express';

const app = express();
app.use(express.json());

const handler = async (req, res) => {
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
    const urlDestino = `${PLATFORM_API_URL.replace(/\/$/, '')}/bot/messages`;
    const response = await fetch(urlDestino, {
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
    return res.status(500).json({ error: error.message });
  }
};

// Aceita em qualquer caminho que o rewrite entregar
app.post('*', handler);

export default app;