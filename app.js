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
    
    // Don't show the button if speech recognition isn't available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        voiceInputButton.style.display = 'none';
        return;
    }
    
    // Fix the mic button position
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
    
    // Click handler for microphone button
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
            // Create a new instance each time to avoid state issues
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            
            // Very simple configuration, focusing on reliability
            recognition.lang = 'en-US';
            recognition.interimResults = false; // Only final results
            recognition.maxAlternatives = 1;
            recognition.continuous = false;
            
            // Start recording UI updates first
            isListening = true;
            voiceInputButton.innerHTML = '<i class="fas fa-stop"></i>';
            voiceInputButton.classList.add('recording');
            messageInput.placeholder = 'Listening...';
            
            // Handle results
            recognition.onresult = function(event) {
                if (event.results[0] && event.results[0][0]) {
                    messageInput.value = event.results[0][0].transcript;
                }
                stopListening();
            };
            
            // Handle errors simply
            recognition.onerror = function(event) {
                console.error('Recognition error:', event.error);
                messageInput.placeholder = 'Voice recognition error. Please type instead.';
                setTimeout(() => {
                    messageInput.placeholder = 'Type your message...';
                }, 3000);
                stopListening();
            };
            
            // Clean up after recognition ends
            recognition.onend = function() {
                stopListening();
            };
            
            // Actually start
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
        
        // Stop recognition if it exists
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                // Ignore errors on stop
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
        // Cancel any ongoing speech from Web Speech API
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // First, try to use ElevenLabs for more natural voice
        const useElevenLabs = await useElevenLabsVoice(text);
        
        // If ElevenLabs fails or isn't available, fall back to browser TTS
        if (!useElevenLabs) {
            await useBrowserTTS(text);
        }
    } catch (error) {
        console.error('Speech error:', error);
        // Fallback to browser TTS if there's any error
        await useBrowserTTS(text);
    }
}

// Use ElevenLabs for more natural voice
async function useElevenLabsVoice(text) {
    try {
        // Check if text is too long (around 2,500 characters)
        if (text.length > 2400) {
            console.log('Text too long for ElevenLabs, using browser TTS');
            return false;
        }
        
        // Create audio element for playing the response
        let audioElement = document.getElementById('ada-voice');
        if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = 'ada-voice';
            document.body.appendChild(audioElement);
        }
        
        console.log('Attempting to use ElevenLabs for voice...');
        
        // Add event handlers for better debugging
        audioElement.onerror = (e) => {
            console.error('Audio element error:', e);
        };
        
        // Use the more stable text-to-speech endpoint instead of stream-input
        const apiUrl = '/api/elevenlabs-tts-debug';
        
        // Parameters for a more natural voice
        const requestData = {
            text: text,
            voice_id: "EXAVITQu4vr4xnSDxMaL", // Female voice "Rachel"
            model_id: "eleven_monolingual_v1",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        };
        
        // Store this in sessionStorage to avoid rate limiting
        if (sessionStorage.getItem('elevenLabsRequests')) {
            const requests = JSON.parse(sessionStorage.getItem('elevenLabsRequests'));
            // If we've made more than 3 requests in the last hour, use browser TTS
            if (requests.length >= 3) {
                const oldestRequest = requests[0];
                // If oldest request is less than 1 hour old, use browser TTS
                if (Date.now() - oldestRequest < 3600000) {
                    console.log('ElevenLabs rate limit reached, using browser TTS');
                    return false;
                }
                // Remove oldest request
                requests.shift();
            }
            requests.push(Date.now());
            sessionStorage.setItem('elevenLabsRequests', JSON.stringify(requests));
        } else {
            sessionStorage.setItem('elevenLabsRequests', JSON.stringify([Date.now()]));
        }
        
        console.log('Sending request to ElevenLabs...');
        
        // Call our server endpoint that will handle the API call with proper key
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            console.error(`ElevenLabs API error: ${response.status}`);
            // Log more detailed error information
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return false;
        }
        
        console.log('ElevenLabs response received successfully');
        
        // Get the audio data and play it
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioElement.src = audioUrl;
        
        // Add event listeners for better debugging
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

// Enhanced browser TTS as fallback
async function useBrowserTTS(text) {
    if (!window.speechSynthesis) return;
    
    try {
        // Get the best feminine voice
        const voice = await getOptimalFeminineVoice();
        if (!voice) {
            console.log('No suitable voice found');
            return;
        }
        
        // Split text into sentences for more natural pauses
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        // Function to speak each sentence with slight variations
        const speakSentence = (index) => {
            if (index >= sentences.length || !isVoiceEnabled) return;
            
            const utterance = new SpeechSynthesisUtterance(sentences[index]);
            
            // Set voice and adjust parameters for a more pleasant feminine voice
            utterance.voice = voice;
            
            // Add subtle variations to make it sound more natural
            utterance.pitch = 1.1 + (Math.random() * 0.1); // Slightly higher pitch for feminine voice (1.1-1.2)
            utterance.rate = 0.95 + (Math.random() * 0.1); // Slightly slower rate (0.95-1.05)
            utterance.volume = 1.0;
            
            // Subtle variations for each sentence
            if (sentences[index].includes('?')) {
                utterance.pitch += 0.05; // Questions slightly higher pitched
            }
            if (sentences[index].includes('!')) {
                utterance.rate += 0.05; // Exclamations slightly faster
            }
            
            // Handle end of speech
            utterance.onend = () => {
                // Small pause between sentences
                setTimeout(() => {
                    speakSentence(index + 1);
                }, 250);
            };
            
            // Speak the sentence
            window.speechSynthesis.speak(utterance);
        };
        
        // Start speaking from the first sentence
        speakSentence(0);
    } catch (error) {
        console.error('Browser TTS error:', error);
    }
}

// Get the optimal feminine voice with better selection criteria
async function getOptimalFeminineVoice() {
    return new Promise((resolve) => {
        // Function to find the best voice
        const findVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                return null;
            }
            
            // Priority list of premium female voices (typically sound better)
            const premiumVoiceNames = [
                'Samantha', 'Victoria', 'Ava', 'Allison', 'Susan', 'Karen', 'Moira', 'Tessa',
                'Fiona', 'Alex', 'Veena', 'Joana', 'Kyoko', 'Amelie', 'Sara'
            ];
            
            // Try to find premium voices first (they usually sound better)
            for (const name of premiumVoiceNames) {
                const voice = voices.find(v => 
                    v.name.includes(name) || 
                    v.name.toLowerCase().includes(name.toLowerCase())
                );
                if (voice) return voice;
            }
            
            // Next priority: any English female voice
            const femaleEnglishVoice = voices.find(v => 
                (v.name.includes('female') || v.name.includes('Female') || 
                /\b(f|F)\b/.test(v.name) || !v.name.includes('Male')) && 
                (v.lang.startsWith('en') || v.lang.includes('EN'))
            );
            if (femaleEnglishVoice) return femaleEnglishVoice;
            
            // Next priority: any female voice
            const femaleVoice = voices.find(v => 
                v.name.includes('female') || v.name.includes('Female') || 
                /\b(f|F)\b/.test(v.name) || !v.name.includes('Male')
            );
            if (femaleVoice) return femaleVoice;
            
            // Last resort: first English voice or default
            const englishVoice = voices.find(v => v.lang.startsWith('en') || v.lang.includes('EN'));
            return englishVoice || voices[0];
        };
        
        // If voices are already loaded
        const voice = findVoice();
        if (voice) {
            resolve(voice);
            return;
        }
        
        // If voices aren't loaded yet, wait for them
        const voicesChanged = () => {
            const voice = findVoice();
            if (voice) {
                resolve(voice);
                window.speechSynthesis.removeEventListener('voiceschanged', voicesChanged);
            }
        };
        
        window.speechSynthesis.addEventListener('voiceschanged', voicesChanged);
        
        // Fallback in case voices never load
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
