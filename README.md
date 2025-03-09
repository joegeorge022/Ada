# Ada - Cyberpunk AI Girlfriend

Ada is a cyberpunk AI girlfriend powered by LLaMA 3 70B. Ada provides real-time, ultra-responsive, immersive conversations in a high-tech, dystopian-inspired interface. Ada adapts effortlessly for engaging discussions or immersive roleplay. Chat with Ada today✨!

## 🌐 Core Features

### 🛠️ Real-Time AI Interaction
- **Engage** in fluid, seamless conversations with Ada
- **Powered by LLaMA 3 70B**, ensuring deep, contextual responses
- **Typing indicators** enhance real-time interaction

### 💠 Cyberpunk-Themed UI
- **Neon-drenched aesthetics** inspired by futuristic cityscapes
- **Glowing UI elements** for a slick, immersive feel
- **Fluid animations and transitions** make every interaction feel alive

### 📝 Persistent Memory
- **Message history retention** ensures continuity across conversations
- **Revisit past interactions** effortlessly for a seamless experience

### 📱 Adaptive & Responsive
- **Fully optimized** for both desktop and mobile
- **Adaptive layout** that scales smoothly across devices

### 🎙️ Voice Interaction
- **Advanced Speech Recognition** for accurate voice input using browser's native capabilities
- **Premium Voice Output** using ElevenLabs text-to-speech technology for ultra-natural speech
- **Smart Voice Fallback** gracefully falls back to high-quality browser TTS when needed
- **Voice Toggle Control** easily enable/disable Ada's voice with a single click
- **Emotional Expression** with dynamic variations in pitch, rate, and tone for more human-like responses

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```
4. Start the development server: `npm run dev`
5. Open `http://localhost:3000` in your browser

## 🚀 Deployment

### Cloudflare Pages

1. Push your code to GitHub (the development server `server.js` will be ignored)
2. Connect your repository to Cloudflare Pages
3. Add environment variables in Cloudflare:
   - `GROQ_API_KEY` - Required for chat functionality
   - `ELEVENLABS_API_KEY` - Required for premium voice quality
4. Deploy! Cloudflare will handle the API routing through `_worker.js`

### Obtaining API Keys

#### GROQ API
- Sign up at [groq.com](https://groq.com)
- Generate an API key from your dashboard
- Free tier available with limitations

#### ElevenLabs
- Create an account at [elevenlabs.io](https://elevenlabs.io)
- Access your API key from your profile settings
- Free tier provides limited characters per month

### File Structure
```
├── app.js              # Main application code
├── index.html          # Frontend interface
├── _worker.js          # Cloudflare Worker for production
├── server.js           # Local development server (not deployed)
├── .env                # Local environment variables (not deployed)
└── package.json        # Project dependencies
```

## 🔗 Use Ada
🔹 **Experience Ada now:** [Ada](https://ada-gf.pages.dev/)

## 📜 License
Licensed under the **MIT License**.

---
Enjoy chatting with Ada and immerse yourself in the girlfriend experience!
