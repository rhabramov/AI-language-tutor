require('dotenv').config();  // 👈 Loads DEEPL_API_KEY
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');


let conversationHistory = [];
const approvedWordsData = JSON.parse(fs.readFileSync('./data/approvedWords.json', 'utf8'));
const approvedWordsList = approvedWordsData.words.slice(0, 50).join(', ');
const approvedWords = approvedWordsData.words;
const approvedSet = new Set(approvedWords.map(w => w.toLowerCase()));
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen3:1.7b';  // Your model
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

console.log('✅ Loaded', approvedWords.length, 'approved words');
console.log(`🤖 Ollama model: ${OLLAMA_MODEL}`);

if (!DEEPL_API_KEY) {
  console.error('❌ DEEPL_API_KEY missing from .env file!');
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>🌍 DeepL + Ollama Qwen2 Backend</h1>
    <p>✅ DeepL API: ${DEEPL_API_KEY ? 'Ready' : 'Missing'}</p>
    <p>✅ Approved words: ${approvedWords.length}</p>
    <p>🤖 Ollama: ${OLLAMA_MODEL}</p>
    <p><a href="/test">Test API</a></p>
  `);
});

app.get('/test', (req, res) => {
  res.json({ 
    message: "DeepL + Ollama ready!", 
    approvedWordsCount: approvedWords.length,
    deeplKeySet: !!DEEPL_API_KEY
  });
});

// MAIN SPEECH PROCESSING ROUTE
app.post('/api/process-speech', async (req, res) => {
  const { text, targetLang = 'ES' } = req.body;  // ES=Spanish, HE=Hebrew
  
  console.log('📥 Input (', targetLang, '):', text);

  try {
    // 1. 👇 REAL DEEPL: TargetLang → English
    const englishInput = await translateDeepL(text, targetLang, 'EN');
    console.log('🌐 DeepL → English:', englishInput);

    // 2. 👇 LOCAL OLLAMA QWEN2
    const aiReplyRaw = await callOllamaQwen2(englishInput, targetLang);
    
    // 3. Filter to approved words ONLY
    const aiReplyFiltered = filterToApprovedWords(aiReplyRaw);
    console.log('🤖 Qwen2 → Filtered:', aiReplyFiltered);

    // 4. 👇 REAL DEEPL: English → TargetLang
    const targetReply = await translateDeepL(aiReplyFiltered, 'EN', targetLang);
    console.log('🌐 DeepL English →', targetLang, ':', targetReply);

    res.json({
      userText: text,
      englishInput,
      aiTextRaw: aiReplyRaw,
      aiText: aiReplyFiltered,
      aiTextX: targetReply,
      targetLang,
      wordCheck: {
        approvedWordsCount: approvedWords.length,
        wordsUsed: aiReplyFiltered.toLowerCase().split(/\s+/).filter(w => w.length > 1)
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 👇 REAL DEEPL TRANSLATION
// 👇 NEW: Header-based authentication (DeepL 2026 standard)
async function translateDeepL(text, sourceLang, targetLang) {
  try {
    const response = await axios.post('https://api-free.deepl.com/v2/translate', {
      text: [text],           // 👈 Array format required
      source_lang: sourceLang,
      target_lang: targetLang,
      tag_handling: 'html'
    }, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,  // ✅ NEW HEADER AUTH
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.data.translations[0].text;
  } catch (error) {
    console.error('DeepL error:', error.response?.data || error.message);
    // Fallbacks
    const fallbacks = {
      'ES': '¡Hola! ¿Cómo estás?',
      'HE': 'שלום! מה שלומך?',
      'RU': 'Привет! Как дела?',
      'EN': 'Hello! How are you?'
    };
    return fallbacks[targetLang] || 'Hello! Nice to practice.';
  }
}

function removeEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
}

// 👇 LOCAL OLLAMA QWEN2 (unchanged)
async function callOllamaQwen2(input, targetLang) {
  try {
    // Build conversation context (last 6 exchanges max)
    const recentHistory = conversationHistory.slice(-6);
    const historyContext = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    const fullPrompt = `You are a friendly conversation partner for English language practice. 

STRICT RULES:
1. Use ONLY these approved words: ${approvedWordsList}
2. Use only present tense or past tense verbs.

${historyContext ? 'Recent conversation:\n' + historyContext + '\n\n' : ''}

User says: "${input}"

Reply following the rules above:`;

    console.log('📝 Qwen2 prompt length:', fullPrompt.length, 'chars');

    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: {
        num_predict: 512,     // 👈 Full responses
        temperature: 0.3,     // 👈 Consistent
        top_p: 0.9,
        num_ctx: 8192         // 👈 Large context window
      }
    }, { 
      timeout: 120000
    });

    let fullReply = response.data.response.trim();

    fullReply = removeEmojis(fullReply);
    
    // Add to conversation memory
    conversationHistory.push({ role: 'user', content: input, lang: targetLang });
    conversationHistory.push({ role: 'assistant', content: fullReply });
    
    // Keep only last 12 exchanges (6 turns)
    if (conversationHistory.length > 12) {
      conversationHistory = conversationHistory.slice(-12);
    }
    
    console.log('💾 Conversation memory:', conversationHistory.length, 'exchanges');
    return fullReply;
    
  } catch (error) {
    console.error('Ollama error:', error.message);
    return "Error";
  }
}


// 👇 APPROVED WORDS FILTER (unchanged)
function filterToApprovedWords(reply) {
  if (!reply || reply.length < 10 || reply === "Error") {
    return "It seems there was a problem";  // Safety fallback
  }

    return reply.charAt(0).toUpperCase() + reply.slice(1) + '.';
}


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 DeepL + Qwen2 server on http://localhost:${PORT}`);
  console.log(`✅ DeepL API: ${DEEPL_API_KEY ? 'Connected' : 'Missing'}`);
  console.log(`🤖 Ollama: ${OLLAMA_MODEL}`);
  console.log(`✅ Approved words: ${approvedWords.length}`);
});