# ToiBot Chatbot

ToiBot is a chatbot application built with Node.js and the [Flowise SDK](https://www.npmjs.com/package/flowise-sdk). It provides a web interface that enables users to interact with their Flowise workflows.

## Features

- **Real-time Chat Interface**: Engage with Flowise workflows in real time through a user-friendly interface.
- **Streaming**:  Receive responses in a continuous stream, providing a more natural and engaging conversational experience.
- **Follow-up Prompts**: Suggest follow-up questions to enhance user engagement.
- **Session Management**: Preserve context throughout interactions by utilizing session IDs.
- **Responsive Design**: Adapts to all screen sizes.
- **Markdown Support**:  Responses are displayed with Markdown formatting to improve readability and presentation.
- **Security**: Employs the Flowise API key to ensure continuous chatbot security.

## Disclaimer

This project is intended as a starting point for inexperienced users looking to explore and learn about the Flowise SDK. It provides a basic foundation for building applications using the SDK but is not intended for production use and will not be actively maintained. Users are encouraged to fork the project and adapt it to their specific needs and use cases. Please note that ongoing support or updates should not be expected.

## Prerequisites

- An active [Flowise workflow](https://github.com/FlowiseAI/Flowise) and Flowise API key
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

The ToiBot chatbot uses the Flowise SDK to interact with the Flowise API. The SDK manages communication with the Flowise API, including session IDs to maintain context across multiple interactions.

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

This project is licensed under the ISC License. Use it as you see fit.
