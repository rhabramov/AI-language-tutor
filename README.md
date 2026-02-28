# AI-language-tutor
AI language tutor to help you practice a new language.


AI Language Practice App - Quick Setup Guide
============================================

Dependencies:
- Node.js (v18+) + npm
- Ollama + Qwen3:1.7b model (~3GB) (or whichever model you'd like). This laptop only has a CPU w/ 16GB RAM, so chose a small model to practice with. 
- DeepL Free API key (500k chars/month)
- VS Code (optional, recommended)

Setup Instructions (10 minutes):

1. Install Node.js
Windows: https://nodejs.org -> LTS version -> Install
Verify: node --version && npm --version

2. Install Ollama
Windows: https://ollama.com/download -> OllamaInstaller.exe -> Install
Verify: ollama --version
Pull model: ollama pull qwen3:1.7b
Start server: ollama serve (keep running)

3. Get DeepL API Key (FREE)
1. https://www.deepl.com/pro-api -> Sign up
2. Account -> API Keys & Limits -> Copy key (format: xxx-xxx:fx)
3. Save for Step 5

4. Download & Extract App
Download: [LangApp folder]
Extract to: C:\LangApp\
Structure:
LangApp/
├── backend/
│   ├── server.js
│   ├── data/
│   │   └── approvedWords.json
│   └── .env <- CREATE THIS
└── frontend/

5. Configure Backend
cd LangApp\backend
1. Create .env file:
 ---> DEEPL_API_KEY=your-deepl-key-here:fx
2. Install dependencies:
npm install

6. Run App (3 Terminals)

Terminal 1 (Ollama):
ollama serve

Terminal 2 (Backend):
cd C:\LangApp\backend
node server.js
See: DeepL + Qwen3 server on http://localhost:3001

Terminal 3 (Frontend):
cd C:\LangApp\frontend
npm install
npm start
Browser opens: http://localhost:3000

How to Use:
1. Choose language: Spanish / Hebrew / Russian
2. Adjust speed slider (0.5x slow -> 2.0x fast)
3. Start Speaking -> Say anything
4. Send to AI -> Get intelligent reply
5. Box auto-clears -> Ready for next turn!

Features:
- Real DeepL translation (ES/HE/RU <-> English)
- Local Qwen3:1.7b (private, remembers conversation)
- Approved word filtering (simple English)
- Speed control (0.5x-2.0x)
- Conversation memory (6 turns)

Troubleshooting:
"Cannot find server.js" -> cd backend first
"Ollama 404" -> ollama list -> Update OLLAMA_MODEL in server.js
"DeepL error" -> Check .env has correct API key
"Speech not working" -> Use Chrome, allow microphone

Share with Friends:
- Zip LangApp folder -> Send
- They follow steps 1-6 above
- Works on Windows/Mac (Ollama + Node.js)
- No accounts needed except DeepL free key
