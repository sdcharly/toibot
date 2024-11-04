class ToiBotBridge {
  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('message', (event) => {
      const { type, config } = event.data;
      
      switch (type) {
        case 'SET_CONFIG':
          if (config.fullscreen) {
            this.setFullscreen();
          }
          if (config.hideFullscreenToggle) {
            this.hideFullscreenToggle();
          }
          if (config.styles) {
            this.injectStyles(config.styles);
          }
          if (config.welcomeMessage) {
            this.setWelcomeMessage(config.welcomeMessage);
          }
          break;
      }
    });
  }

  setFullscreen() {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.classList.add('fullscreen');
    }
  }

  hideFullscreenToggle() {
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    if (fullscreenToggle) {
      fullscreenToggle.remove();
    }
  }

  injectStyles(styles) {
    const styleId = 'toibot-custom-styles';
    let styleSheet = document.getElementById(styleId);
    
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      document.head.appendChild(styleSheet);
    }
    
    styleSheet.textContent = styles;
  }

  setWelcomeMessage(message) {
    // Only set welcome message if no chat history exists
    if (!localStorage.getItem('chatHistory')) {
      const chatWindow = document.getElementById('chat-window-content');
      if (chatWindow && window.addMessage) {
        window.addMessage('bot', message);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.ToiBotBridge = new ToiBotBridge();
});
