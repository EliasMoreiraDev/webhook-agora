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

  res.status(200).send('OK');

  const { data } = req.body;
  const conversationId = data?.conversationId || req.body?.conversationId;

  if (body.dados?.text?.trim().toLowerCase() === '!ping') {
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