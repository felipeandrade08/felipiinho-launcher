// =====================================================================
// FELIPINHO LAUNCHER - Configuração do Express App
// =====================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const rotasApi = require('./routes/index');
const tratadorDeErros = require('./middlewares/tratadorDeErros');
const rotaNaoEncontrada = require('./middlewares/rotaNaoEncontrada');
const { testarConexao } = require('./config/database');

const app = express();

app.set('trust proxy', 1);

// Segurança e performance
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());

// CORS
const origensPermitidas = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origem, callback) => {
    if (!origem || origensPermitidas.includes('*') || origensPermitidas.includes(origem)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pela política de CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Webhook Stripe precisa receber o corpo RAW antes do express.json().
app.use('/api/webhooks/stripe', require('./routes/stripeWebhook.routes'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limitadorGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { sucesso: false, mensagem: 'Muitas requisições. Tente novamente em alguns minutos.' }
});
app.use('/api', limitadorGeral);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    sistema: 'FELIPINHO LAUNCHER',
    descricao: 'API de gestão de transportadora virtual para Euro Truck Simulator 2 (ETS2)',
    versao: '1.0.0',
    status: 'online'
  });
});

// Health check usado pelo Render.
// Não deixa o estado do banco derrubar a API, mas informa claramente se ele está OK.
app.get('/api/health', async (req, res) => {
  try {
    await testarConexao();
    return res.status(200).json({
      sucesso: true,
      status: 'ok',
      api: 'online',
      banco: 'online'
    });
  } catch (erro) {
    console.error('Health check - banco indisponível:', erro.message);
    return res.status(503).json({
      sucesso: false,
      status: 'degraded',
      api: 'online',
      banco: 'offline',
      mensagem: 'API online, mas o banco de dados está indisponível.'
    });
  }
});

app.use('/api', rotasApi);

app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);

module.exports = app;
