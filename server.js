import express from 'express';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET 
const BOT_TOKEN = process.env.BOT_TOKEN
const PLATFORM_API_URL = 'https://api.agora.fslab.dev';

app.post('/webhook/agora', async (req, res) => {

  const signature = req.headers['x-agora-signature'];

  if (signature !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Assinatura inválida' });
  }

  res.status(200).send('OK');

  const { data } = req.body;
  const message = data?.message || req.body?.message || '';
  const conversationId = data?.conversationId || req.body?.conversationId;

  if (message.trim().toLowerCase() === '!ping') {
    try {
      await fetch(`${PLATFORM_API_URL}/bot/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-token': BOT_TOKEN
        },
        body: JSON.stringify({
          conversationId: conversationId,
          text: 'Pong! 🏓'
        })
      });
    } catch (err) {
      console.error('Erro ao disparar mensagem:', err);
    }
  }
});

app.listen(5500, () => {
  console.log('Servidor rodando na porta 5500');
});