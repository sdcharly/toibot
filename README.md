# ToiBot Chatbot

ToiBot is a chatbot application developed using Node.js and the Flowise SDK. It offers a web interface for users to interact with a chatbot that processes questions and provides responses in real-time. The application uses Flowise's API to deliver intelligent and context-aware responses.

## Features

- **Real-time Chat Interface**: Interact with the chatbot in real-time with a user-friendly experience.
- **Event-Streaming**: Receive updates as the chatbot processes queries.
- **Follow-up Prompts**: Suggest follow-up questions to enhance user engagement.
- **Session Management**: Maintain context across interactions using session IDs.
- **Responsive Design**: Consistent experience across various devices.
- **Markdown Support**: Display responses with Markdown formatting for improved readability and presentation.
- **Security**: Utilize the Flowise API key to ensure the chatbot remains secure at all times.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

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
   npm start
   ```

5. Open a web browser and navigate to `http://localhost:3000` to interact with the chatbot.

## Environment Variables

The application uses a `.env` file to manage sensitive information such as API keys and URLs. Ensure you have the `dotenv` package installed to load these variables into your application.

## Flowise SDK Integration

The ToiBot chatbot uses the Flowise SDK to interact with the Flowise API. This integration enables the chatbot to process natural language queries and provide intelligent responses. The SDK manages communication with the Flowise API, including session IDs to maintain context across multiple interactions.

### Session ID Feature

The session ID feature is essential for maintaining context in conversations. Each session is identified by a unique session ID, allowing the chatbot to remember previous interactions and provide more relevant responses. This feature is particularly useful for applications requiring continuity in user interactions.

## Project Structure

- `server.js`: The main server file that sets up the Express application and handles API requests.
- `public/`: Contains static files served by the Express application, including HTML, CSS, and client-side JavaScript.
- `package.json`: Lists the project dependencies and scripts.

## Dependencies

- `express`: Web framework for Node.js
- `flowise-sdk`: SDK for interacting with the Flowise API
- `node-fetch`: A lightweight module that brings `window.fetch` to Node.js
- `readline`: Provides an interface for reading data from a Readable stream
- `marked`: A markdown parser and compiler
- `dotenv`: Loads environment variables from a `.env` file into `process.env`

## License

This project is licensed under the ISC License.
