class ToiBot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    
    this.iframe.addEventListener('load', () => {
      this.iframe.contentWindow.postMessage({
        type: 'SET_CONFIG',
        config: {
          fullscreen: this.getAttribute('fullscreen') !== 'false',
          hideFullscreenToggle: this.getAttribute('hide-fullscreen-toggle') !== 'false',
          styles: this.getAttribute('custom-styles'),
          welcomeMessage: this.getAttribute('welcome-message')
        }
      }, '*');
    });
  }

  get serverUrl() {
    // Get the script URL
    const scriptElement = document.querySelector('script[src*="toibot.js"]');
    if (scriptElement) {
      const scriptUrl = new URL(scriptElement.src);
      return scriptUrl.origin;
    }
    return window.location.origin;
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        z-index: 9999;
      }

      .chatbot-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      iframe {
        width: 100%;
        height: 100%;
        border: none;
        position: absolute;
        top: 0;
        left: 0;
        background: transparent;
      }
    `;

    const container = document.createElement('div');
    container.className = 'chatbot-container';

    this.iframe = document.createElement('iframe');
    this.iframe.src = `${this.serverUrl}/`;
    this.iframe.title = 'ToiBot Chatbot';
    this.iframe.setAttribute('loading', 'lazy');
    this.iframe.setAttribute('crossorigin', 'anonymous');
    this.iframe.setAttribute('allow', 'cross-origin-isolated');

    container.appendChild(this.iframe);
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }
}

customElements.define('toi-bot', ToiBot);