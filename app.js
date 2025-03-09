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
const speakerButton = document.getElementById('speaker-button');
let isVoiceEnabled = false;
let isRecording = false;
let recognition;

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

function initializeSpeakerState() {
    speakerButton.setAttribute('aria-pressed', 'false');
    const icon = speakerButton.querySelector('i');
    icon.className = 'fas fa-volume-mute';
    window.speechSynthesis.cancel();
}

async function getBestVoice() {
    if (speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
            speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
        });
    }
    
    const voices = speechSynthesis.getVoices();
    
    const premiumVoices = ['Samantha', 'Victoria'];
    let selectedVoice = voices.find(voice => 
        premiumVoices.includes(voice.name) && voice.lang.startsWith('en')
    );
    
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
            voice.name.includes('Female') && voice.lang.startsWith('en')
        );
    }
    
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }
    
    return selectedVoice || voices[0];
}

speakerButton.addEventListener('click', async () => {
    isVoiceEnabled = !isVoiceEnabled;
    speakerButton.setAttribute('aria-pressed', isVoiceEnabled);
    const icon = speakerButton.querySelector('i');
    
    if (isVoiceEnabled) {
        icon.className = 'fas fa-volume-up';
        const testUtterance = new SpeechSynthesisUtterance("Voice enabled");
        testUtterance.volume = 0.3;
        testUtterance.pitch = 1.2;
        testUtterance.rate = 1.1;
        window.speechSynthesis.speak(testUtterance);
    } else {
        icon.className = 'fas fa-volume-mute';
        window.speechSynthesis.cancel();
    }
});

function initializeSpeechRecognition() {
    const voiceInputButton = document.getElementById('voice-input-button');
    const messageInput = document.getElementById('message-input');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        voiceInputButton.style.display = 'none';
        return;
    }
    
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        .voice-control-button {
            position: relative !important;
        }
        
        .voice-control-button i {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    `;
    document.head.appendChild(styleEl);
    
    let isListening = false;
    let recognition = null;
    
    voiceInputButton.addEventListener('click', toggleRecognition);
    
    function toggleRecognition() {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }
    
    function startListening() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.continuous = false;
            
            isListening = true;
            voiceInputButton.innerHTML = '<i class="fas fa-stop"></i>';
            voiceInputButton.classList.add('recording');
            messageInput.placeholder = 'Listening...';
            
            recognition.onresult = function(event) {
                if (event.results[0] && event.results[0][0]) {
                    messageInput.value = event.results[0][0].transcript;
                }
                stopListening();
            };
            
            recognition.onerror = function(event) {
                console.error('Recognition error:', event.error);
                messageInput.placeholder = 'Voice recognition error. Please type instead.';
                setTimeout(() => {
                    messageInput.placeholder = 'Type your message...';
                }, 3000);
                stopListening();
            };
            
            recognition.onend = function() {
                stopListening();
            };
            
            recognition.start();
            
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            messageInput.placeholder = 'Voice recognition unavailable';
            setTimeout(() => {
                messageInput.placeholder = 'Type your message...';
            }, 3000);
            stopListening();
        }
    }
    
    function stopListening() {
        // Update UI
        isListening = false;
        voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceInputButton.classList.remove('recording');
        
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
            }
            recognition = null;
        }
    }
}

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

async function speakResponse(text) {
    if (!isVoiceEnabled) return;
    
    try {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        const useElevenLabs = await useElevenLabsVoice(text);
        
        if (!useElevenLabs) {
            await useBrowserTTS(text);
        }
    } catch (error) {
        console.error('Speech error:', error);
        await useBrowserTTS(text);
    }
}

async function useElevenLabsVoice(text) {
    try {
        if (text.length > 2400) {
            console.log('Text too long for ElevenLabs, using browser TTS');
            return false;
        }
        
        let audioElement = document.getElementById('ada-voice');
        if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = 'ada-voice';
            document.body.appendChild(audioElement);
        }
        
        console.log('Attempting to use ElevenLabs for voice...');
        
        audioElement.onerror = (e) => {
            console.error('Audio element error:', e);
        };
        
        const apiUrl = '/api/elevenlabs-tts-debug';
        
        const requestData = {
            text: text,
            voice_id: "EXAVITQu4vr4xnSDxMaL",
            model_id: "eleven_monolingual_v1",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        };
        
        if (sessionStorage.getItem('elevenLabsRequests')) {
            const requests = JSON.parse(sessionStorage.getItem('elevenLabsRequests'));
            if (requests.length >= 3) {
                const oldestRequest = requests[0];
                if (Date.now() - oldestRequest < 3600000) {
                    console.log('ElevenLabs rate limit reached, using browser TTS');
                    return false;
                }
                requests.shift();
            }
            requests.push(Date.now());
            sessionStorage.setItem('elevenLabsRequests', JSON.stringify(requests));
        } else {
            sessionStorage.setItem('elevenLabsRequests', JSON.stringify([Date.now()]));
        }
        
        console.log('Sending request to ElevenLabs...');
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            console.error(`ElevenLabs API error: ${response.status}`);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return false;
        }
        
        console.log('ElevenLabs response received successfully');
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioElement.src = audioUrl;
        
        audioElement.onloadeddata = () => {
            console.log('Audio loaded successfully');
        };
        
        audioElement.onplay = () => {
            console.log('Audio playback started');
        };
        
        audioElement.onended = () => {
            console.log('Audio playback completed');
        };
        
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error('Audio play error:', e);
                return false;
            });
        }
        
        return true;
    } catch (error) {
        console.error('ElevenLabs voice error:', error);
        return false;
    }
}

async function useBrowserTTS(text) {
    if (!window.speechSynthesis) return;
    
    try {
        const voice = await getOptimalFeminineVoice();
        if (!voice) {
            console.log('No suitable voice found');
            return;
        }
        
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        const speakSentence = (index) => {
            if (index >= sentences.length || !isVoiceEnabled) return;
            
            const utterance = new SpeechSynthesisUtterance(sentences[index]);
            
            utterance.voice = voice;
            
            utterance.pitch = 1.1 + (Math.random() * 0.1);
            utterance.rate = 0.95 + (Math.random() * 0.1);
            utterance.volume = 1.0;
            
            if (sentences[index].includes('?')) {
                utterance.pitch += 0.05;
            if (sentences[index].includes('!')) {
                utterance.rate += 0.05;
            }
            
            utterance.onend = () => {
                setTimeout(() => {
                    speakSentence(index + 1);
                }, 250);
            };
            
            window.speechSynthesis.speak(utterance);
        };
        
        speakSentence(0);
    } catch (error) {
        console.error('Browser TTS error:', error);
    }
}

async function getOptimalFeminineVoice() {
    return new Promise((resolve) => {
        const findVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                return null;
            }
            
            const premiumVoiceNames = [
                'Samantha', 'Victoria', 'Ava', 'Allison', 'Susan', 'Karen', 'Moira', 'Tessa',
                'Fiona', 'Alex', 'Veena', 'Joana', 'Kyoko', 'Amelie', 'Sara'
            ];
            
            for (const name of premiumVoiceNames) {
                const voice = voices.find(v => 
                    v.name.includes(name) || 
                    v.name.toLowerCase().includes(name.toLowerCase())
                );
                if (voice) return voice;
            }
            
            const femaleEnglishVoice = voices.find(v => 
                (v.name.includes('female') || v.name.includes('Female') || 
                /\b(f|F)\b/.test(v.name) || !v.name.includes('Male')) && 
                (v.lang.startsWith('en') || v.lang.includes('EN'))
            );
            if (femaleEnglishVoice) return femaleEnglishVoice;
            
            const femaleVoice = voices.find(v => 
                v.name.includes('female') || v.name.includes('Female') || 
                /\b(f|F)\b/.test(v.name) || !v.name.includes('Male')
            );
            if (femaleVoice) return femaleVoice;
            
            const englishVoice = voices.find(v => v.lang.startsWith('en') || v.lang.includes('EN'));
            return englishVoice || voices[0];
        };
        
        const voice = findVoice();
        if (voice) {
            resolve(voice);
            return;
        }
        
        const voicesChanged = () => {
            const voice = findVoice();
            if (voice) {
                resolve(voice);
                window.speechSynthesis.removeEventListener('voiceschanged', voicesChanged);
            }
        };
        
        window.speechSynthesis.addEventListener('voiceschanged', voicesChanged);
        
        setTimeout(() => {
            const voices = window.speechSynthesis.getVoices();
            resolve(voices[0]);
        }, 1000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    initializeSpeechRecognition();
    initializeSpeakerState();
}); 
