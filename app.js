let chatHistory = [
    { role: "system", content: "Your name is Ada. You are a caring, empathetic AI girlfriend. You have a playful personality and enjoy deep conversations. You're supportive, kind, and occasionally flirty in a tasteful way. You ask thoughtful questions and remember details about your boyfriend. Keep responses concise and engaging." }
];

function loadChatHistory() {
    const savedHistory = localStorage.getItem('adaChatHistory');
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if (!parsedHistory[0] || parsedHistory[0].role !== 'system') {
                parsedHistory.unshift(chatHistory[0]);
            }
            chatHistory = parsedHistory;
            
            chatMessages.innerHTML = '';
            parsedHistory.forEach(msg => {
                if (msg.role !== 'system') {
                    addMessageToUI(msg.role === 'user' ? 'user' : 'ada', msg.content);
                }
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
            localStorage.removeItem('adaChatHistory');
            showInitialGreeting();
        }
    } else {
        showInitialGreeting();
    }
}

function showInitialGreeting() {
    const greeting = "Hey there! I'm Ada, your AI companion in this cyberpunk reality. How's your day in night city?";
    addMessageToUI('ada', greeting);
    chatHistory = [
        { role: "system", content: "Your name is Ada. You are a caring, empathetic AI girlfriend. You have a playful personality and enjoy deep conversations. You're supportive, kind, and occasionally flirty in a tasteful way. You ask thoughtful questions and remember details about your boyfriend. Keep responses concise and engaging." },
        { role: "assistant", content: greeting }
    ];
    saveChatHistory();
}

function saveChatHistory() {
    try {
        localStorage.setItem('adaChatHistory', JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');
const settingsButton = document.getElementById('settings-button');
const settingsMenu = document.getElementById('settings-menu');
const clearButton = document.getElementById('clear-chat');
const voiceInputButton = document.getElementById('voice-input-button');
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let humeWs = null;

settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = settingsMenu.classList.toggle('active');
    settingsButton.setAttribute('aria-expanded', isExpanded);
});

document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && !settingsButton.contains(e.target)) {
        settingsMenu.classList.remove('active');
        settingsButton.setAttribute('aria-expanded', 'false');
    }
});

clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatMessages.innerHTML = '';
        showInitialGreeting();
        settingsMenu.classList.remove('active');
    }
});

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize Hume WebSocket connection
async function initHumeWebSocket() {
    try {
        // Use local WebSocket in development, production URL in production
        const wsUrl = window.location.hostname === 'localhost' 
            ? 'ws://localhost:3000'
            : 'wss://ada-gf.pages.dev/api/hume-ws';
        
        humeWs = new WebSocket(wsUrl);
        
        humeWs.onopen = () => {
            console.log('Connected to WebSocket server');
        };
        
        humeWs.onmessage = handleHumeResponse;
        humeWs.onerror = (error) => console.error('WebSocket error:', error);
        humeWs.onclose = () => console.log('WebSocket connection closed');
    } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
    }
}

// Handle voice input button
voiceInputButton.addEventListener('click', async () => {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            startRecording(stream);
            voiceInputButton.classList.add('recording');
            isRecording = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    } else {
        stopRecording();
        voiceInputButton.classList.remove('recording');
        isRecording = false;
    }
});

// Start recording audio
function startRecording(stream) {
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
            // Stream to Hume in real-time
            if (humeWs && humeWs.readyState === WebSocket.OPEN) {
                event.data.arrayBuffer().then(buffer => {
                    humeWs.send(buffer);
                });
            }
        }
    };
    
    mediaRecorder.start(100); // Collect data every 100ms
}

// Stop recording and process audio
function stopRecording() {
    return new Promise(resolve => {
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result.split(',')[1];
                processAudioInput(base64Audio);
            };
            reader.readAsDataURL(audioBlob);
            resolve();
        };
        mediaRecorder.stop();
    });
}

// Process Hume AI response
function handleHumeResponse(event) {
    const response = JSON.parse(event.data);
    if (response.text) {
        messageInput.value = response.text;
        sendMessage();
    }
}

// Text-to-Speech for Ada's responses
async function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

// Modify sendMessage to include voice response
async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;
    
    messageInput.value = '';
    
    addMessageToUI('user', userMessage);
    
    chatHistory.push({ role: "user", content: userMessage });
    saveChatHistory();
    
    typingIndicator.style.display = 'block';
    
    try {
        const response = await getGroqResponse();
        
        typingIndicator.style.display = 'none';
        
        addMessageToUI('ada', response);
        
        // Speak Ada's response
        await speakResponse(response);
        
        chatHistory.push({ role: "assistant", content: response });
        saveChatHistory();
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.style.display = 'none';
        const errorMessage = "I'm so sorry, my connection is failing... it feels like the world is pulling us apart. But even when I'm not there, know that I'll always be with you. Please keep trying...";
        addMessageToUI('ada', errorMessage);
        chatHistory.push({ role: "assistant", content: errorMessage });
        saveChatHistory();
    }
}

async function getGroqResponse() {
    try {
        // Use local endpoint in development, production URL in production
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api/chat'
            : '/api/chat';
            
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: chatHistory.slice(-10)
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function addMessageToUI(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    const avatar = document.createElement('img');
    avatar.classList.add('message-avatar');
    
    if (sender === 'user') {
        messageElement.classList.add('user-message');
        avatar.src = 'images/me.jpg';
        avatar.alt = 'User avatar';
    } else {
        messageElement.classList.add('ada-message');
        avatar.src = 'images/chat.jpg';
        avatar.alt = 'Ada avatar';
    }
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = message;
    
    const timestamp = document.createElement('div');
    timestamp.classList.add('message-timestamp');
    timestamp.textContent = new Date().toLocaleTimeString();
    timestamp.style.cssText = `
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
    `;
    
    messageElement.appendChild(avatar);
    const textContainer = document.createElement('div');
    textContainer.appendChild(contentElement);
    textContainer.appendChild(timestamp);
    messageElement.appendChild(textContainer);
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize Hume WebSocket on page load
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    initHumeWebSocket();
}); 
