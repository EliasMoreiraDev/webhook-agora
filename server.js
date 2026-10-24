import express from 'express';

const app = express();
app.use(express.json());

// Sanitiza variáveis de ambiente removendo aspas e ponto-e-vírgula acidentais
function cleanEnv(val) {
  if (!val) return '';
  return val
    .trim()
    .replace(/;+$/, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

const WEBHOOK_SECRET = cleanEnv(process.env.WEBHOOK_SECRET);
const BOT_TOKEN = cleanEnv(process.env.BOT_TOKEN);
const PLATFORM_API_URL = cleanEnv(process.env.PLATFORM_API_URL || 'https://api.agora.fslab.dev').replace(/\/+$/, '');
const BOT_OWNER_ID = cleanEnv(process.env.BOT_OWNER_ID || process.env.MEU_USER_ID || '6a73e92d7237502b187d79ff');

const AUTO_REPLY_TEXT = 'Bom dia! ☀️ Encaminhando sua mensagem para o suporte. Em breve, um atendente irá te responder! ⏳';

// Rota de verificação do status da API (útil para checar na Vercel)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    servico: 'webhook-agora',
    agoraApi: PLATFORM_API_URL
  });
});

app.post('/webhook/agora', async (req, res) => {
  // 1. Validação de assinatura do Ágora
  const signature = req.headers['x-agora-signature'];
  if (WEBHOOK_SECRET && signature !== WEBHOOK_SECRET) {
    console.warn('[AUTH] Assinatura inválida no header X-Agora-Signature');
    return res.status(401).json({ error: 'Assinatura inválida no X-Agora-Signature' });
  }

  // 2. Extração segura dos dados do evento
  const dados = req.body?.dados || req.body?.data || req.body;
  const conversationId = dados?.conversationId || req.body?.conversationId;
  const senderId = dados?.senderId;
  const messageText = (dados?.text || dados?.message || '').trim();

  if (!conversationId) {
    console.warn('[PAYLOAD] conversationId ausente no evento recebido:', req.body);
    return res.status(400).json({ error: 'conversationId ausente no corpo da requisição' });
  }

  // 3. Prevenção de loop contra a própria resposta automática do bot
  if (messageText === AUTO_REPLY_TEXT.trim()) {
    console.log(`[LOOP-GUARD] Mensagem com o mesmo texto do bot ignorada na conversa ${conversationId}`);
    return res.status(200).json({ status: 'ignored', motivo: 'Mensagem gerada pelo próprio bot' });
  }

  // 4. Prevenção de loop: ignora mensagens enviadas pelo dono do bot (o bot publica em nome dele)
  if (BOT_OWNER_ID && senderId === BOT_OWNER_ID) {
    console.log(`[LOOP-GUARD] Mensagem do dono do bot (${senderId}) ignorada na conversa ${conversationId}`);
    return res.status(200).json({ status: 'ignored', motivo: 'Mensagem enviada pelo dono do bot' });
  }

  // 5. Ignora mensagens de sistema que não necessitam de resposta do bot
  if (dados?.type && dados.type === 'sistema') {
    return res.status(200).json({ status: 'ignored', motivo: 'Mensagem de sistema' });
  }

  // 6. Envio da resposta do bot para a API do Ágora
  try {
    const urlDestino = `${PLATFORM_API_URL}/bot/messages`;
    console.log(`[BOT] Enviando resposta automática para conversa ${conversationId}`);

    const response = await fetch(urlDestino, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-token': BOT_TOKEN
      },
      body: JSON.stringify({
        conversationId: conversationId,
        text: AUTO_REPLY_TEXT
      })
    });

    const respostaTexto = await response.text();

    if (!response.ok) {
      console.error(`[AGORA API ERROR] Status ${response.status}:`, respostaTexto);
      return res.status(response.status).json({
        error: 'Erro retornado pela API do Ágora',
        status: response.status,
        detalhe: respostaTexto
      });
    }

    console.log(`[BOT] Mensagem enviada com sucesso para conversa ${conversationId}`);
    return res.status(200).json({ status: 'success', message: 'Mensagem enviada com sucesso' });

  } catch (error) {
    console.error('[ERRO DISPARO BOT]', error);
    return res.status(500).json({
      error: 'Erro interno ao disparar bot',
      detalhe: error.message
    });
  }
});

// Suporte para execução local com Node/nodemon
if (process.env.NODE_ENV !== 'production' || process.env.PORT) {
  const PORT = process.env.PORT || 5500;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

// Exportação compatível com Serverless Functions da Vercel
export default app;
