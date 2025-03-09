# Ada - Cyberpunk AI Girlfriend

Ada is a cyberpunk AI girlfriend powered by LLaMA 3 70B. Ada provides real-time, ultra-responsive, immersive conversations in a high-tech, dystopian-inspired interface. Ada adapts effortlessly for engaging discussions or immersive roleplay. Chat with Ada today✨!

## 🌐 Core Features

### 🎙️ Voice Interaction
- **Natural Voice Input** powered by Hume AI for accurate speech recognition
- **Emotional Voice Response** with dynamic text-to-speech
- **Real-time Processing** for seamless voice conversations

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

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   HUME_API_KEY=your_hume_api_key_here
   ```
4. Start the development server: `npm run dev`
5. Open `http://localhost:3000` in your browser

## 🚀 Deployment

### Cloudflare Pages

1. Push your code to GitHub (the development server `server.js` will be ignored)
2. Connect your repository to Cloudflare Pages
3. Add environment variables in Cloudflare:
   - `GROQ_API_KEY`
   - `HUME_API_KEY`
4. Deploy! Cloudflare will handle the API routing through `_worker.js`

### File Structure
```
├── app.js              # Main application code
├── index.html          # Frontend interface
├── _worker.js          # Cloudflare Worker for production
├── server.js           # Local development server (not deployed)
├── .env               # Local environment variables (not deployed)
└── package.json       # Project dependencies
```

## 🔗 Use Ada
🔹 **Experience Ada now:** [Ada](https://ada-gf.pages.dev/)

## 📜 License
Licensed under the **MIT License**—hack, mod, and explore freely.

---
Enjoy chatting with Ada and immerse yourself in the girlfriend experience!
