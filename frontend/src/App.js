import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function App() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Language state
  const [targetLang, setTargetLang] = useState('HE'); // Hebrew default
  const [speechLang, setSpeechLang] = useState('he-IL'); // Hebrew speech
  const [speechSpeed, setSpeechSpeed] = useState(0.9);  // 👈 NEW: Speed control (0.5-2.0)

  const languages = {
    HE: { code: 'HE', name: 'Hebrew 🇮🇱', speech: 'he-IL' },
    ES: { code: 'ES', name: 'Spanish 🇪🇸', speech: 'es-ES' },
    RU: { code: 'RU', name: 'Russian 🇷🇺', speech: 'ru-RU' }
  };

  useEffect(() => {
    console.log('Transcript:', JSON.stringify(transcript), 'Listening:', listening);
  }, [transcript, listening]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const handleStartListening = () => {
    console.log('🔊 Starting speech recognition for:', languages[targetLang].name);
    SpeechRecognition.startListening({
      continuous: true,
      language: speechLang,  // 👈 Dynamic language
      interimResults: true,
    });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
  };

  const speakReply = (text) => {
const speakReply = (text) => {
  // 👇 REMOVE EMOJIS BEFORE SPEAKING
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  console.log('🔊 Speaking at', speechSpeed.toFixed(1) + 'x speed:', cleanText);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = languages[targetLang].speech;
  utterance.rate = speechSpeed;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
};


    console.log('🔊 Speaking at', speechSpeed.toFixed(1) + 'x speed:', text);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languages[targetLang].speech;
    utterance.rate = speechSpeed;  // 👈 NEW: Dynamic speed!
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };


  const handleSendToBackend = async () => {
    if (!transcript.trim()) {
      alert('Please speak first!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/process-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: transcript, 
          targetLang: targetLang  // 👈 Send selected language
        }),
      });
      
      const data = await response.json();
      console.log('✅ Backend response:', data);
      setAiResponse(data);
      
      // 🎵 Speak reply immediately
      speakReply(data.aiTextX);

      resetTranscript();
      
    } catch (err) {
      console.error('Backend error:', err);
      alert('Backend error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🌍 AI Language Practice Tutor</h1>
      
      {/* 👇 NEW: Language Selector */}
      {/* 👇 ENHANCED: Language + Speed Controls */}
<div style={{ 
  background: '#e3f2fd', 
  padding: '20px', 
  borderRadius: '12px', 
  marginBottom: '20px',
  textAlign: 'center'
}}>
  <div style={{ marginBottom: '15px' }}>
    <label style={{ fontSize: '18px', marginRight: '15px' }}>
      Practice Language: 
    </label>
    <select 
      value={targetLang} 
      onChange={(e) => {
        const lang = e.target.value;
        setTargetLang(lang);
        setSpeechLang(languages[lang].speech);
      }}
      style={{ 
        padding: '10px 15px', 
        fontSize: '18px', 
        borderRadius: '8px',
        border: '2px solid #2196F3',
        background: 'white'
      }}
    >
      <option value="HE">{languages.HE.name}</option>
      <option value="ES">{languages.ES.name}</option>
      <option value="RU">{languages.RU.name}</option>
    </select>
  </div>
  
  {/* 👇 NEW: Speed Slider */}
  <div>
    <label style={{ fontSize: '16px', marginRight: '10px' }}>
      Speaking Speed: 
    </label>
    <span style={{ fontWeight: 'bold', marginRight: '10px', color: '#1976d2' }}>
      {speechSpeed.toFixed(1)}x
    </span>
    <input 
      type="range" 
      min="0.5" 
      max="2.0" 
      step="0.1"
      value={speechSpeed}
      onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
      style={{ 
        width: '250px', 
        height: '8px', 
        borderRadius: '5px',
        background: '#ddd',
        outline: 'none',
        cursor: 'pointer'
      }}
    />
    <div style={{ fontSize: '12px', color: '#666' }}>
      🐌 0.5x (slow) → 🐇 2.0x (fast)
    </div>
  </div>
  
  <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
    Speech recognition: {languages[targetLang].name}
  </div>
</div>


      <div style={{ marginBottom: '20px', padding: '15px', background: listening ? '#e3f2fd' : '#f5f5f5', borderRadius: '8px' }}>
        <strong>Status:</strong> {listening ? '🎤 Listening...' : '🛑 Ready'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleStartListening} 
          disabled={listening}
          style={{ 
            padding: '15px 25px', 
            fontSize: '18px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            marginRight: '10px',
            cursor: listening ? 'not-allowed' : 'pointer'
          }}
        >
          🎤 Start Speaking ({languages[targetLang].name})
        </button>
        <button 
          onClick={handleStopListening} 
          disabled={!listening}
          style={{ 
            padding: '15px 25px', 
            fontSize: '18px', 
            background: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            marginRight: '10px'
          }}
        >
          ⏹️ Stop
        </button>
        <button 
          onClick={resetTranscript}
          style={{ 
            padding: '15px 25px', 
            fontSize: '18px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px'
          }}
        >
          🔄 Clear
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>📝 You said ({languages[targetLang].name}):</h3>
        <div style={{ 
          padding: '20px', 
          background: '#e8f5e8', 
          borderRadius: '8px', 
          fontSize: '20px', 
          minHeight: '60px',
          direction: targetLang === 'HE' ? 'rtl' : 'ltr'
        }}>
          {transcript || 'Speak in your chosen language...'}
        </div>
      </div>

      <button 
        onClick={handleSendToBackend} 
        disabled={!transcript.trim() || loading}
        style={{ 
          padding: '20px 40px', 
          fontSize: '20px', 
          background: loading ? '#ccc' : '#FF9800', 
          color: 'white', 
          border: 'none', 
          borderRadius: '12px',
          cursor: (transcript.trim() && !loading) ? 'pointer' : 'not-allowed',
          width: '100%'
        }}
      >
        {loading ? '🤖 AI + DeepL Thinking...' : `🚀 Send to AI (${languages[targetLang].name})`}
      </button>

      {aiResponse && (
        <div style={{ marginTop: '30px', padding: '25px', background: '#fff3e0', borderRadius: '12px' }}>
          <h3>🤖 AI replied:</h3>
          <div style={{ fontSize: '18px', marginBottom: '15px' }}>
            <strong>🇺🇸 English:</strong> {aiResponse.aiText}
          </div>
          <div style={{ 
            fontSize: '22px', 
            color: '#1976d2', 
            marginBottom: '20px',
            direction: targetLang === 'HE' ? 'rtl' : 'ltr',
            textAlign: targetLang === 'HE' ? 'right' : 'left'
          }}>
            <strong>{languages[targetLang].name}:</strong> {aiResponse.aiTextX}
          </div>
          <button 
            onClick={() => speakReply(aiResponse.aiTextX)} 
            style={{ 
              padding: '15px 30px', 
              fontSize: '18px', 
              background: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🔊 Repeat AI Reply
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
