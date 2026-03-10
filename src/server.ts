import 'dotenv/config';
import express from 'express';
import { handleWebhook } from './webhook/handler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST /webhooks/taddy - receive Taddy webhook events
app.post('/webhooks/taddy', handleWebhook);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Run ngrok to get a public URL for your local webhook endpoint: `ngrok http 3000`');
  console.log(`Local webhook endpoint: http://localhost:${PORT}/webhooks/taddy`);
});
