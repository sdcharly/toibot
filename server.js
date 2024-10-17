require('dotenv').config();

const express = require('express');
const path = require('path');
const { FlowiseClient } = require('flowise-sdk');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));

const client = new FlowiseClient({
  baseUrl: process.env.FLOWISE_BASE_URL,
  apiKey: process.env.FLOWISE_API_KEY
});
let sessionId = null;

app.post('/api/chat', async (req, res) => {
  const question = req.body.question;

  try {

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const prediction = await client.createPrediction({
      chatflowId: process.env.FLOWISE_CHATFLOW_ID,
      question: question,
      streaming: true,
      overrideConfig: {
        systemMessage: 'Help the user with their questions',
        sessionId: sessionId
      }
    });

    for await (const chunk of prediction) {
      console.log('Received chunk:', chunk);
      if (chunk.event === 'token') {
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.data })}\n\n`);
      } else if (chunk.event === 'metadata') {
        sessionId = chunk.data.sessionId;
        let followUpPrompts = chunk.data.followUpPrompts;
        if (typeof followUpPrompts === 'string') {
          try {
            followUpPrompts = JSON.parse(followUpPrompts);
          } catch (e) {
            console.error('Error parsing followUpPrompts:', e);
            followUpPrompts = [];
          }
        }

        const metadata = {
          sessionId: chunk.data.sessionId,
          followUpPrompts: followUpPrompts
        };
        console.log('Metadata:', metadata);
        res.write(`data: ${JSON.stringify({ type: 'metadata', content: metadata })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
