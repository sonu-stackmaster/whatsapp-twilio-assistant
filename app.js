require('dotenv').config();
const express = require('express');
const waHandler = require('./functions/wa');
const app = express();
const port = 3000;
const twilio = require('twilio');

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hit this in the browser to confirm ngrok is reaching your app (e.g. https://YOUR-NGROK-URL/health)
app.get('/health', (req, res) => {
  res.status(200).send('OK - WhatsApp bot is reachable');
});

app.post('/wa', (req, res) => {
  const body = req.body || {};
  // Twilio sends status callbacks (read/delivered/sent) to the same URL; they have no WaId/Body
  if (body.MessageStatus && !body.Body) {
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(EMPTY_TWIML);
  }
  console.log('\n=== WhatsApp webhook called ===', new Date().toISOString());
  console.log('req.body', body);

  // Reply immediately so Twilio does not timeout (15s). We send the bot reply via API after processing.
  res.set('Content-Type', 'text/xml');
  res.status(200).send(EMPTY_TWIML);

  (async () => {
    try {
      let message = await waHandler(body);
      if (message == null || typeof message !== 'string' || !message.trim()) {
        message = 'Thanks for your message. We will get back to you shortly.';
      }
      const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
      await client.messages.create({
        from: body.To,
        to: `whatsapp:${body.WaId}`,
        body: message,
      });
      console.log('Bot reply sent to WhatsApp via API');
    } catch (err) {
      console.error('Error processing/sending reply:', err);
      try {
        const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
        await client.messages.create({
          from: body.To,
          to: `whatsapp:${body.WaId}`,
          body: 'Something went wrong. Please try again later.',
        });
      } catch (sendErr) {
        console.error('Failed to send error message to user:', sendErr);
      }
    }
  })();
});

app.listen(port, () => {
  console.log(`App listening at port: ${port}`);
});
