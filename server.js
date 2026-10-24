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
    const urlDestino = `${PLATFORM_API_URL.replace(/\/$/, '')}/bot/messages`;
    console.log('A chamar endpoint:', urlDestino);

    const response = await fetch(urlDestino, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-token': BOT_TOKEN[cite: 2]
      },
      body: JSON.stringify({
        conversationId: conversationId,[cite: 2]
        text: 'Bom dia! ☀️ Encaminhando sua mensagem para o suporte. Em breve, um atendente irá te responder! ⏳'[cite: 2]
      })
    });

    const respostaTexto = await response.text();
    console.log(`Resposta Ágora (Status ${response.status}):`, respostaTexto);

    if (!response.ok) {
      return res.status(response.status).send(`Erro da plataforma: ${respostaTexto}`);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Detalhe do erro no fetch:', error);
    return res.status(500).json({
      mensagem: 'Erro interno ao disparar bot',
      detalhe: error.message
    });
  }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {});