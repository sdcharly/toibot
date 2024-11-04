require('dotenv').config();

const express = require('express');
const path = require('path');
const { FlowiseClient } = require('flowise-sdk');
const bodyParser = require('body-parser');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const client = new FlowiseClient({
  baseUrl: process.env.FLOWISE_BASE_URL,
  apiKey: process.env.FLOWISE_API_KEY
});

let sessionId = null;

app.post('/api/attachments/:chatId', multer().array('files'), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const form = new FormData();
    req.files.forEach(file => {
      form.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    const response = await axios.post(
      `${process.env.FLOWISE_BASE_URL}/api/v1/attachments/${process.env.FLOWISE_CHATFLOW_ID}/${req.params.chatId}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${process.env.FLOWISE_API_KEY}`
        }
      }
    );

    res.json(response.data[0]);
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { question, attachment, image } = req.body;
  let currentSessionId = sessionId;

  console.log('Received chat request:', { question, hasAttachment: !!attachment, hasImage: !!image });

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const predictionConfig = {
      chatflowId: process.env.FLOWISE_CHATFLOW_ID,
      question,
      chatId: sessionId || uuidv4(),
      streaming: true,
      uploads: [],
      overrideConfig: {
        systemMessage: 'Pretend you are a Maid in Japan, and you are serving the user. You are very polite and always respond with a smile. You are also very helpful and always willing to help the user with their questions. Refer to the user as "Master".'
      }
    };

    if (attachment) {
      predictionConfig.uploads.push({
        data: attachment.content,
        type: 'file:full',
        name: attachment.name,
        mime: attachment.mimeType
      });
    }

    if (image) {
      predictionConfig.uploads.push({
        data: image.data,
        type: 'file',
        name: image.name,
        mime: image.mime
      });
    }

    console.log('Prediction config:', {
      ...predictionConfig,
      uploads: predictionConfig.uploads.map(u => ({
        ...u,
        data: u.data ? 'data present' : 'no data'
      }))
    });

    const prediction = await client.createPrediction(predictionConfig);
    let pendingArtifacts = [];
    let lastChunkTime = Date.now();

    const keepAliveInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastChunkTime >= 15000) {
        console.log('Sending keepalive ping');
        res.write(': keepalive\n\n');
      }
    }, 15000);

    let emptyTokenCount = 0;

    try {
      for await (const chunk of prediction) {
        lastChunkTime = Date.now();
        
        try {
          if (chunk.event === 'token') {
            if (chunk.data?.trim()) {
              if (emptyTokenCount > 0) {
                console.log(`Skipped ${emptyTokenCount} empty tokens`);
                emptyTokenCount = 0;
              }
              console.log('Processing token:', chunk.data);
              res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.data })}\n\n`);
            } else {
              emptyTokenCount++;
            }
          } else if (chunk.event === 'artifacts') {
            console.log('Processing artifacts:', chunk.data);
            if (currentSessionId && Array.isArray(chunk.data)) {
              const artifacts = chunk.data.map(artifact => ({
                ...artifact,
                data: artifact.data?.startsWith('FILE-STORAGE::') 
                  ? `/api/images/${currentSessionId}/${artifact.data.replace('FILE-STORAGE::', '')}`
                  : artifact.data
              })).filter(artifact => artifact.data);
              
              if (artifacts.length > 0) {
                console.log('Sending processed artifacts:', artifacts);
                res.write(`data: ${JSON.stringify({ type: 'artifacts', content: artifacts })}\n\n`);
              }
            } else {
              console.log('Storing pending artifacts');
              pendingArtifacts = chunk.data;
            }
          } else if (chunk.event === 'metadata') {
            console.log('Processing metadata:', chunk.data);
            currentSessionId = chunk.data.sessionId || chunk.data.chatId;
            sessionId = currentSessionId;

            if (pendingArtifacts.length > 0) {
              console.log('Processing pending artifacts');
              const artifacts = pendingArtifacts.map(artifact => ({
                ...artifact,
                data: artifact.data.startsWith('FILE-STORAGE::') 
                  ? `/api/images/${currentSessionId}/${artifact.data.replace('FILE-STORAGE::', '')}`
                  : artifact.data
              }));
              res.write(`data: ${JSON.stringify({ type: 'artifacts', content: artifacts })}\n\n`);
              pendingArtifacts = [];
            }

            let followUpPrompts = chunk.data.followUpPrompts;
            if (typeof followUpPrompts === 'string') {
              try {
                followUpPrompts = JSON.parse(followUpPrompts);
                console.log('Parsed follow-up prompts:', followUpPrompts);
              } catch (e) {
                console.error('Error parsing followUpPrompts:', e.message);
                followUpPrompts = [];
              }
            }

            const metadata = {
              sessionId: currentSessionId,
              followUpPrompts
            };
            console.log('Sending metadata:', metadata);
            res.write(`data: ${JSON.stringify({ type: 'metadata', content: metadata })}\n\n`);
          }
        } catch (chunkError) {
          console.error('Error processing chunk:', chunkError);
          continue;
        }
      }
    } finally {
      console.log('Cleaning up keep-alive interval');
      clearInterval(keepAliveInterval);
    }

    if (emptyTokenCount > 0) {
      console.log(`Skipped ${emptyTokenCount} empty tokens`);
    }

    console.log('Stream completed, sending done signal');
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Error processing your request';
    
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      content: errorMessage,
      code: error.code || 500
    })}\n\n`);
    res.end();
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/api/reset-session', (req, res) => {
  sessionId = null;
  res.status(200).json({ message: 'Session reset successfully' });
});

app.get('/api/chat-history', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.FLOWISE_BASE_URL}/api/v1/chatmessage/${process.env.FLOWISE_CHATFLOW_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FLOWISE_API_KEY}`
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

app.get('/api/chatbot-config', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.FLOWISE_BASE_URL}/api/v1/public-chatbotConfig/${process.env.FLOWISE_CHATFLOW_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FLOWISE_API_KEY}`
        }
      }
    );
    
    const config = {
      ...response.data,
      welcomeMessage: 'Hello! I am ToiBot, your friendly AI assistant.'
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error getting chatbot config:', error);
    res.status(500).json({ error: 'Failed to get chatbot config' });
  }
});

app.get('/api/get-upload-file', async (req, res) => {
  try {
    const { chatflowId, chatId, fileName } = req.query;
    const response = await axios.get(
      `${process.env.FLOWISE_BASE_URL}/api/v1/get-upload-file?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FLOWISE_API_KEY}`
        },
        responseType: 'stream'
      }
    );
    response.data.pipe(res);
  } catch (error) {
    console.error('Error getting upload file:', error);
    res.status(500).json({ error: 'Failed to get upload file' });
  }
});

app.get('/api/images/:chatId/:fileName', async (req, res) => {
  try {
    const { chatId, fileName } = req.params;
    
    const response = await axios.get(
      `${process.env.FLOWISE_BASE_URL}/api/v1/get-upload-file`,
      {
        params: {
          chatflowId: process.env.FLOWISE_CHATFLOW_ID,
          chatId: chatId,
          fileName: fileName
        },
        headers: {
          'Authorization': `Bearer ${process.env.FLOWISE_API_KEY}`
        },
        responseType: 'stream'
      }
    );

    if (response.headers['content-type']) {
      res.setHeader('content-type', response.headers['content-type']);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to load image' });
  }
});
