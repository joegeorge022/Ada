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

const clearButton = document.createElement('button');
clearButton.id = 'clear-chat';
clearButton.textContent = 'Clear Chat';
clearButton.style.cssText = `
    background: rgba(255, 46, 136, 0.2);
    color: white;
    border: 1px solid var(--neon-pink);
    border-radius: 5px;
    padding: 8px 15px;
    margin-left: 10px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.8rem;
    transition: all 0.3s ease;
`;
clearButton.addEventListener('mouseover', () => {
    clearButton.style.background = 'rgba(255, 46, 136, 0.4)';
    clearButton.style.boxShadow = '0 0 10px rgba(255, 46, 136, 0.3)';
});
clearButton.addEventListener('mouseout', () => {
    clearButton.style.background = 'rgba(255, 46, 136, 0.2)';
    clearButton.style.boxShadow = 'none';
});
document.querySelector('.chat-input').appendChild(clearButton);

clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatMessages.innerHTML = '';
        showInitialGreeting();
    }
});

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

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
        const response = await fetch('/api/chat', {
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

document.addEventListener('DOMContentLoaded', loadChatHistory); 
