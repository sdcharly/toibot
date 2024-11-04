# ToiBot Chatbot

ToiBot is a chatbot application built with Node.js and powered by [Flowise SDK](https://www.npmjs.com/package/flowise-sdk). It provides a functional and customizable chatbot web interface that enables users to interact with their Flowise workflows.

https://github.com/user-attachments/assets/569bd8c5-a5f7-499f-921c-54d4c18e7ae7

New on Flowise? Check out [FlowiseAI](https://flowiseai.com) to get started.

##  🚀 Features

- **Real-time Chat Interface**: Engage with your Flowise flows in real time through a user-friendly interface.
- **Streaming**: Receive responses in a continuous stream, providing a more natural and engaging conversational experience.
- **Follow-up Prompts**: Suggest follow-up questions to enhance user engagement.
- **File Upload Support**: Upload and process various file types including TXT, PDF, DOC, DOCX, CSV, JSON, and XML.
- **Image Upload Support**: Upload and process image files with preview functionality.
- **Image Display**: The chatbot can display images received in the conversation.
- **Attachment Preview**: Shows thumbnails for uploaded images and file information for documents.
- **File Size Limits**: Enforces configurable size limits based on Flowise settings.
- **Drag-and-Drop Functionality**: Supports drag-and-drop for uploading files and images.
- **AI Message Copying**: Users can easily copy AI-generated messages.
- **Dynamic Upload Controls**: Shows/hides upload buttons based on Flowise configuration.
- **Session Management**: Preserve context throughout interactions by utilizing session IDs.
- **Chat History**: Maintains conversation history across sessions using local storage.
- **Reset Functionality**: Allows users to start fresh conversations.
- **Auto-growing Input**: The chat input field automatically expands as you type, providing a comfortable writing experience while maintaining a clean interface.
- **Boxed/Full Screen Mode**: Allows users to switch between a boxed chat interface and a fullscreen experience.
- **Customizable Welcome Message**: Allows defining a personalized welcome message to greet users upon entering the chat.
- **Visual Feedback**: Displays loading animations and progress indicators during operations.
- **Markdown Support**: Responses are displayed with Markdown formatting to improve readability and presentation.
- **API Proxy**: The proxy ensures that sensitive information like your API host and chatflow ID are never exposed to the client-side code.
- **Security**: Employs the Flowise API key to ensure continuous chatbot security.
- **Embed Feature**: Easily embed the chatbot on any webpage with a simple script tag.

## 📋 Prerequisites 

- An active [Flowise workflow](https://github.com/FlowiseAI/Flowise) and Flowise API key (free!).
- Node.js (version 14 or higher)
- npm (Node Package Manager)

## 🛠️ Installation 

1. Clone the repository:

   ```bash
   git clone https://github.com/toi500/ToiBot.git
   cd ToiBot
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Flowise API credentials:

   ```plaintext
   FLOWISE_API_KEY=your_api_key_here
   FLOWISE_BASE_URL=your_base_url_here
   FLOWISE_CHATFLOW_ID=your_chatflow_id_here
   ```

4. Start the server:

   ```bash
   npm start # or
   npm run dev
   ```

5. Open a web browser and navigate to `http://localhost:3000` to interact with the chatbot.

## 🌐 Embedding the Chatbot 

### Basic Integration

To embed the chatbot on any webpage, include the following script tag and custom element:

```html
<!-- Basic usage (defaults to fullscreen) -->
<script defer src="https://your-server-url/embed/toibot.js"></script>
<toi-bot></toi-bot>
```

```html
<!-- With customization -->
<script defer src="https://your-server-url/embed/toibot.js"></script>
<toi-bot
  fullscreen="false"
  hide-fullscreen-toggle="false"
  welcome-message="Hello! How can I assist you today?"
  custom-styles="
    .chat-container { background: #f5f5f5; }
    .message.bot { background: #e3f2fd; }
    .message.user { background: #f5f5f5; }
    /* Add more custom styles here */
  "
></toi-bot>
```

#### Available Attributes

- **`fullscreen`**: Controls whether the chatbot opens in fullscreen mode
  - `"true"` (default) - Opens in fullscreen
  - `"false"` - Opens in boxed mode
- **`hide-fullscreen-toggle`**: Controls visibility of the fullscreen toggle button
  - `"true"` (default) - Hides the toggle
  - `"false"` - Shows the toggle
- **`welcome-message`**: Sets a custom welcome message for new chat sessions
- **`custom-styles`**: Injects custom CSS to modify the chatbot's appearance

## 🔧 Server File Configuration 

### System Override

In `server.js`, you can customize the AI's behavior by modifying the `predictionConfig` object: (via `overrideConfig`)

```javascript:server.js
const predictionConfig = {
  chatflowId: process.env.FLOWISE_CHATFLOW_ID,
  question,
  chatId: sessionId || uuidv4(),
  streaming: true,
  uploads: [],
  overrideConfig: {
    systemMessage: 'You are a helpful AI assistant. You are friendly and concise...'
  }
};
```

### Available Override Options

The `overrideConfig` property accepts the following configurations:

```javascript
overrideConfig: {
  systemMessage: 'Your system message here',
  // Add other Flowise-supported configurations
}
```

## ⚙️ Dynamic Configuration 

The chatbot now automatically adapts to your Flowise chatflow configuration:

- **Upload Features**: Buttons for file and image uploads are dynamically shown/hidden based on your Flowise settings.
- **Follow-up Prompts**: Can be enabled/disabled through Flowise configuration.

## 🔒 Security Considerations 

### API Protection Layer

![capture_241104_125527](https://github.com/user-attachments/assets/53b6bf61-2257-4c5b-aa3c-42805ca42291)

ToiBot implements a robust security architecture to protect sensitive information and prevent direct exposure of your Flowise infrastructure:

- **Proxy Protection**: All API calls are routed through a secure backend proxy (`your-server-url/api/chat`), ensuring that sensitive endpoints and credentials are never exposed to the client side.
- **Credential Isolation**: Flowise API keys, base URLs, and chatflow IDs remain strictly server-side, preventing exposure in client-side code or network requests.
- **Request Validation**: All incoming requests are validated and sanitized before being forwarded to the Flowise API.

### Network Architecture

```plaintext
Client Browser <-> ToiBot Server (Proxy) <-> Flowise API
         [your-server-url/api/*]    [Your Flowise Instance]
```

This architecture ensures that:
- Client-side code never directly accesses the Flowise API
- API credentials remain secure on the server
- All requests are properly authenticated and validated
- Response data is sanitized before being sent to the client

### Best Practices

When deploying ToiBot:
- Always use environment variables for sensitive credentials
- Keep all dependencies updated to patch security vulnerabilities

## ⚠️ Disclaimer 

Users are encouraged to fork the project and adapt it to their specific needs and use cases. Please note that ongoing support or updates should not be expected.

## License 📄

This project is licensed under the [ISC License](https://opensource.org/license/isc-license-txt).
