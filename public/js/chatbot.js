function isMobileDevice() {
  return window.matchMedia('(max-width: 768px)').matches;
}

const chatWindow = document.getElementById('chat-window'); 
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const spinner = sendButton.querySelector('.spinner');
const attachedFileContainer = document.getElementById('attached-file-container');
const followUpPromptsContainer = document.getElementById('follow-up-prompts-container');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');

let currentAttachment = null;
let currentImage = null;
let isFirstMessage = true;
let chatbotConfig = null;

async function loadChatbotConfig() {
  try {
    const response = await fetch('/api/chatbot-config');
    if (response.ok) {
      chatbotConfig = await response.json();
      console.log('Loaded config:', chatbotConfig);

      const savedHistory = localStorage.getItem('chatHistory');
      if (!savedHistory && chatbotConfig.welcomeMessage) {
        console.log('Adding welcome message:', chatbotConfig.welcomeMessage);
        addMessage('bot', chatbotConfig.welcomeMessage);
      }

      const imageUploadButton = document.getElementById('image-upload-button');
      const fileUploadButton = document.getElementById('upload-button');

      [imageUploadButton, fileUploadButton].forEach(button => {
        button.style.display = 'none';
        button.classList.remove('visible');
      });

      if (chatbotConfig.uploads?.isImageUploadAllowed) {
        toggleButtonVisibility(imageUploadButton);
      }

      if (chatbotConfig.fullFileUpload?.status) {
        toggleButtonVisibility(fileUploadButton);
      }

      updateAcceptedFileTypes();
    }
  } catch (error) {
    console.error('Error loading chatbot config:', error);
  }
}

function toggleButtonVisibility(button) {
  button.style.display = 'inline-flex';
  setTimeout(() => button.classList.add('visible'), 0);
}

function updateAcceptedFileTypes() {
  if (chatbotConfig.uploads?.fileUploadSizeAndTypes?.length) {
    const fileTypes = chatbotConfig.uploads.fileUploadSizeAndTypes[0].fileTypes;
    fileInput.accept = fileTypes.join(',');
  }

  if (chatbotConfig.uploads?.imgUploadSizeAndTypes?.length) {
    const imageTypes = chatbotConfig.uploads.imgUploadSizeAndTypes[0].fileTypes;
    imageInput.accept = imageTypes.join(',');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadChatbotConfig();
  loadChatHistory();
  initializeDragAndDrop();
  
  if (!isMobileDevice()) {
    userInput.focus();
  }
});

function setButtonLoading(isLoading) {
  sendButton.disabled = isLoading;
  spinner.style.display = isLoading ? 'block' : 'none';
  sendButton.querySelector('svg').style.display = isLoading ? 'none' : 'block';
}

function addMessage(sender, message, attachment = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  if (sender === 'bot') {
    messageDiv.innerHTML = `
      <button class="copy-button" title="Copy message" aria-label="Copy message">
        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px">
          <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/>
        </svg>
        <span class="copied-text">Copied!</span>
      </button>
      <div class="message-content"></div>
      ${message ? '' : `
        <div class="thinking">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      `}
    `;
    if (message) {
      messageDiv.querySelector('.message-content').innerHTML = DOMPurify.sanitize(marked.parse(message));
    }
    
    const copyButton = messageDiv.querySelector('.copy-button');
    copyButton.addEventListener('click', () => {
      const content = messageDiv.querySelector('.message-content');
      const text = content.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text:', err);
      });
    });

    messageDiv.addEventListener('mouseenter', () => {
      copyButton.style.opacity = '1';
    });
    messageDiv.addEventListener('mouseleave', () => {
      copyButton.style.opacity = '0';
      copyButton.classList.remove('copied');
    });

    isFirstMessage = true;
  } else {
    let content = '';
    if (attachment) {
      content += attachment.mime?.startsWith('image/') ? `
        <div class="message-attachment image-preview">
          <img src="${attachment.data}" alt="Uploaded image" class="image-thumbnail">
        </div>
      ` : `
        <div class="message-attachment">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px" viewBox="0 -960 960 960" fill="#ffffff">
            <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v300q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z"/>
          </svg>
          ${attachment.name}
        </div>
      `;
    }
    content += `<div class="message-text">${message}</div>`;
    messageDiv.innerHTML = content;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  saveChatHistory();
}

function showThinkingAnimation() {
  const lastBotMessage = document.querySelector('.message.bot:last-child');
  if (lastBotMessage) {
    const thinkingDiv = lastBotMessage.querySelector('.thinking');
    if (thinkingDiv) {
      thinkingDiv.style.display = 'flex';
    }
  } else {
    addMessage('bot', '');
    showThinkingAnimation();
  }
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideThinkingAnimation() {
  const lastBotMessage = document.querySelector('.message.bot:last-child');
  if (lastBotMessage) {
    const thinkingDiv = lastBotMessage.querySelector('.thinking');
    if (thinkingDiv) {
      thinkingDiv.style.display = 'none';
    }
  }
}

document.getElementById('upload-button').addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  clearSystemMessages();
  if (e.target.files.length > 0) {
    const file = e.target.files[0];

    if (file.type.startsWith('image/')) {
      addMessage('system', 'Please use the image upload button for images.');
      e.target.value = '';
      return;
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      addMessage('system', 'File is too large. Please upload a file smaller than 50MB.');
      return;
    }

    const formData = new FormData();
    formData.append('files', file);

    try {
      setButtonLoading(true);
      const chatId = Date.now().toString();
      const response = await fetch(`/api/attachments/${chatId}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        currentAttachment = {
          content: result.content,
          name: result.name,
          mimeType: result.mimeType,
          size: result.size
        };

        displayAttachedFile(result.name);
      } else {
        addMessage('system', 'Failed to upload file');
      }
    } catch (error) {
      handleError(error, 'Failed to upload file');
    } finally {
      setButtonLoading(false);
    }
  }
});

document.getElementById('image-upload-button').addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
  clearSystemMessages();
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    
    if (!handleFileUpload(file)) {
      e.target.value = '';
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      currentImage = {
        data: base64,
        type: 'file',
        name: file.name,
        mime: file.type,
        preview: base64
      };
      displayAttachedImage(file);
    } catch (error) {
      handleError(error, 'Failed to process image');
    }
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function displayAttachedFile(fileName) {
  attachedFileContainer.innerHTML = `
    <div class="attached-file">
      <div class="file-info">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 -960 960 960" fill="#6246ea">
          <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v300q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z"/>
        </svg>
        <span>${fileName}</span>
      </div>
      <button class="remove-attachment" title="Remove attachment">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  addRemoveButtonHandler('file');
}

function displayAttachedImage(file) {
  attachedFileContainer.innerHTML = `
    <div class="attached-file">
      <div class="file-info image-preview">
        <img src="${currentImage.data || currentImage.preview}" alt="Attached image" class="image-thumbnail">
        <span>${file.name}</span>
      </div>
      <button class="remove-attachment" title="Remove attachment">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  addRemoveButtonHandler('image');
}

function addRemoveButtonHandler(type) {
  const removeButton = attachedFileContainer.querySelector('.remove-attachment');
  if (removeButton) {
    removeButton.addEventListener('click', () => deleteAttachment(type));
  }
}

function deleteAttachment(type) {
  if (type === 'image' && currentImage?.preview) {
    URL.revokeObjectURL(currentImage.preview);
  }
  attachedFileContainer.innerHTML = '';
  (type === 'image' ? imageInput : fileInput).value = '';
  type === 'image' ? (currentImage = null) : (currentAttachment = null);
}

async function sendMessage() {
  clearSystemMessages();
  const message = userInput.value.trim();
  if (message) {
    const tempAttachment = currentAttachment;
    const tempImage = currentImage;

    const attachmentToSend = isFirstMessage ? (tempAttachment || tempImage) : null;
    addMessage('user', message, attachmentToSend);

    userInput.value = '';
    if (isMobileDevice()) {
      userInput.blur();
    }
    setButtonLoading(true);
    showThinkingAnimation();

    attachedFileContainer.innerHTML = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          attachment: tempAttachment,
          image: tempImage
        })
      });

      if (response.ok) {
        const reader = response.body.getReader();
        let botMessage = '';
        let artifacts = [];
        let hasReceivedContent = false;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(5));
              if (data.type === 'token') {
                if (data.content) {
                  if (!hasReceivedContent) {
                    hasReceivedContent = true;
                    hideThinkingAnimation();
                  }
                  botMessage += data.content;
                  updateBotMessage(botMessage, artifacts);
                }
              } else if (data.type === 'artifacts') {
                artifacts = data.content;
                updateBotMessage(botMessage, artifacts);
              } else if (data.type === 'metadata') {
                displayFollowUpPrompts(data.content.followUpPrompts);
              }
            }
          }
        }
      } else {
        hideThinkingAnimation();
        addMessage('bot', 'Sorry, there was an error processing your request.');
      }
    } catch (error) {
      hideThinkingAnimation();
      console.error('Error:', error);
      addMessage('bot', 'Sorry, there was an error processing your request.');
    } finally {
      setButtonLoading(false);
      currentAttachment = null;
      currentImage = null;
      await saveChatHistory();
    }
  }
}

async function updateBotMessage(message, artifacts = []) {
  const lastBotMessage = document.querySelector('.message.bot:last-child');
  if (!lastBotMessage) return;

  const messageContent = lastBotMessage.querySelector('.message-content');
  const thinkingDiv = lastBotMessage.querySelector('.thinking');

  if (messageContent) {
    messageContent.innerHTML = DOMPurify.sanitize(marked.parse(message));
    
    if (artifacts && artifacts.length > 0) {
      artifacts.forEach(artifact => {
        if (artifact.type === 'png' || artifact.type === 'jpeg') {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'generated-image-container';
          imgContainer.innerHTML = `
            <img src="${artifact.data}" alt="Generated image" class="generated-image">
          `;
          messageContent.appendChild(imgContainer);
        }
      });
    }
  }

  if (thinkingDiv) {
    thinkingDiv.style.display = 'none';
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
  await saveChatHistory();
}

function displayFollowUpPrompts(prompts) {
  followUpPromptsContainer.innerHTML = '';

  if (chatbotConfig?.followUpPrompts?.status && prompts?.length > 0) {
    const promptsDiv = document.createElement('div');
    promptsDiv.className = 'follow-up-prompts';
    prompts.forEach(prompt => {
      const promptButton = document.createElement('button');
      promptButton.textContent = prompt;
      promptButton.addEventListener('click', () => {
        userInput.value = prompt;
        sendMessage();
      });
      promptsDiv.appendChild(promptButton);
    });
    followUpPromptsContainer.appendChild(promptsDiv);
  }
}

userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

userInput.addEventListener('input', clearSystemMessages);

function clearSystemMessages() {
  const systemMessages = document.querySelectorAll('.message.system');
  systemMessages.forEach(msg => msg.remove());
}

const resetButton = document.getElementById('reset-chat');

async function resetChat() {
  try {
    const response = await fetch('/api/reset-session', {
      method: 'POST'
    });

    if (response.ok) {
      const dropOverlay = document.querySelector('.drop-overlay');
      chatWindow.innerHTML = '';
      attachedFileContainer.innerHTML = '';
      followUpPromptsContainer.innerHTML = '';
      currentAttachment = null;
      currentImage = null;
      isFirstMessage = true;
      userInput.value = '';
      localStorage.removeItem('chatHistory');
    } else {
      console.error('Failed to reset session');
    }
  } catch (error) {
    console.error('Error resetting session:', error);
  }
}

resetButton.addEventListener('click', resetChat);

async function saveChatHistory() {
  const chatHistory = {
    messages: await Promise.all(Array.from(chatWindow.children).map(async msg => {
      const messageObj = {
        sender: msg.classList.contains('bot') ? 'bot' : 'user',
        content: msg.innerHTML
      };

      const uploadedImg = msg.querySelector('.image-preview img[src^="blob:"]');
      if (uploadedImg) {
        try {
          const response = await fetch(uploadedImg.src);
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          messageObj.imageData = base64;
        } catch (error) {
          console.error('Error converting image to base64:', error);
        }
      }

      return messageObj;
    })),
    isFirstMessage
  };
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
  const savedHistory = localStorage.getItem('chatHistory');
  if (savedHistory) {
    const { messages, isFirstMessage: savedIsFirstMessage } = JSON.parse(savedHistory);
    chatWindow.innerHTML = '';

    const validMessages = messages.filter(msg => {
      if (msg.sender === 'user') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = msg.content;
        const messageText = tempDiv.querySelector('.message-text');
        return messageText && messageText.textContent.trim().length > 0;
      }
      return true;
    });

    validMessages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${msg.sender}`;

      if (msg.imageData) {
        const content = msg.content;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const imgElement = doc.querySelector('.image-preview img');
        if (imgElement) {
          imgElement.src = msg.imageData;
          messageDiv.innerHTML = doc.body.innerHTML;
        } else {
          messageDiv.innerHTML = content;
        }
      } else if (msg.imageParams) {
        const content = msg.content;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const imgElement = doc.querySelector('.image-preview img');
        if (imgElement) {
          const { chatflowId, chatId, fileName } = msg.imageParams;
          imgElement.src = `/api/get-upload-file?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}`;
          messageDiv.innerHTML = doc.body.innerHTML;
        } else {
          messageDiv.innerHTML = content;
        }
      } else {
        messageDiv.innerHTML = msg.content;
      }

      chatWindow.appendChild(messageDiv);
    });

    isFirstMessage = savedIsFirstMessage;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', loadChatHistory);

function handleFileUpload(file, type) {
  if (!chatbotConfig) return false;

  const isImage = file.type.startsWith('image/');

  if (isImage) {
    if (!chatbotConfig.uploads.isImageUploadAllowed) {
      addMessage('system', 'Image uploads are not allowed.');
      return false;
    }

    const config = chatbotConfig.uploads.imgUploadSizeAndTypes[0];
    if (!config.fileTypes.includes(file.type)) {
      addMessage('system', 'Invalid image type.');
      return false;
    }

    if (file.size > config.maxUploadSize * 1024 * 1024) {
      addMessage('system', `Image is too large. Maximum size is ${config.maxUploadSize}MB.`);
      return false;
    }
  } else {
    if (!chatbotConfig.fullFileUpload?.status) {
      addMessage('system', 'File uploads are not allowed.');
      return false;
    }

    if (chatbotConfig.uploads?.fileUploadSizeAndTypes?.length) {
      const config = chatbotConfig.uploads.fileUploadSizeAndTypes[0];
      if (!config.fileTypes.some(type => file.name.toLowerCase().endsWith(type.toLowerCase()))) {
        addMessage('system', 'Invalid file type.');
        return false;
      }

      if (file.size > config.maxUploadSize * 1024 * 1024) {
        addMessage('system', `File is too large. Maximum size is ${config.maxUploadSize}MB.`);
        return false;
      }
    }
  }

  return true;
}

function handleError(error, userMessage) {
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }
  addMessage('system', userMessage);
}

document.addEventListener('DOMContentLoaded', function() {
  const fullscreenToggle = document.getElementById('fullscreen-toggle');
  const chatContainer = document.querySelector('.chat-container');
  const fullscreenIcon = document.querySelector('.fullscreen-icon');
  const exitFullscreenIcon = document.querySelector('.exit-fullscreen-icon');

  fullscreenToggle.addEventListener('click', function() {
    chatContainer.classList.toggle('fullscreen');

    if (chatContainer.classList.contains('fullscreen')) {
      fullscreenIcon.style.display = 'none';
      exitFullscreenIcon.style.display = 'block';
    } else {
      fullscreenIcon.style.display = 'block';
      exitFullscreenIcon.style.display = 'none';
    }
  });
});

function initializeDragAndDrop() {
  const chatContainer = document.querySelector('.chat-container');
  
  const dropOverlay = document.createElement('div');
  dropOverlay.className = 'drop-overlay';
  chatContainer.appendChild(dropOverlay);

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    chatContainer.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  let dragCounter = 0;

  chatContainer.addEventListener('dragenter', (e) => {
    preventDefaults(e);
    dragCounter++;
    if (dragCounter === 1) {
      dropOverlay.classList.add('active');
    }
  });

  chatContainer.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    dragCounter--;
    if (dragCounter === 0) {
      dropOverlay.classList.remove('active');
    }
  });

  chatContainer.addEventListener('drop', (e) => {
    preventDefaults(e);
    dragCounter = 0;
    dropOverlay.classList.remove('active');
    handleDrop(e);
  });

  async function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = [...dt.files];

    if (files.length > 1) {
      addMessage('system', 'Please upload only one file at a time.');
      return;
    }

    const file = files[0];

    if (!handleFileUpload(file)) {
      return;
    }

    if (file.type.startsWith('image/')) {
      try {
        const base64Image = await fileToBase64(file);
        currentImage = {
          data: base64Image,
          type: 'file',
          name: file.name,
          mime: file.type,
          preview: URL.createObjectURL(file)
        };
        displayAttachedImage(file);
      } catch (error) {
        handleError(error, 'Failed to upload image');
      }
    } else {
      const formData = new FormData();
      formData.append('files', file);

      try {
        setButtonLoading(true);
        const chatId = Date.now().toString();
        const response = await fetch(`/api/attachments/${chatId}`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          currentAttachment = {
            content: result.content,
            name: result.name,
            mimeType: result.mimeType,
            size: result.size
          };
          displayAttachedFile(result.name);
        } else {
          addMessage('system', 'Failed to upload file');
        }
      } catch (error) {
        handleError(error, 'Failed to upload file');
      } finally {
        setButtonLoading(false);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const userInput = document.getElementById('user-input');
  const inputContainer = userInput.closest('.input-container');

  function autoGrow() {
    userInput.style.height = '24px';
    const newHeight = Math.min(userInput.scrollHeight, 200);
    userInput.style.height = newHeight + 'px';
    
    if (newHeight > 24) {
      inputContainer.classList.add('multiline');
    } else {
      inputContainer.classList.remove('multiline');
    }
  }

  userInput.addEventListener('input', autoGrow);

  function resetInputHeight() {
    userInput.style.height = '24px';
    inputContainer.classList.remove('multiline');
  }

  const sendButton = document.getElementById('send-button');
  sendButton.addEventListener('click', resetInputHeight);

  userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
      resetInputHeight();
      if (isMobileDevice()) {
        userInput.blur();
      }
    }
  });
});