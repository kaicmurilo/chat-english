import React, { useState, useEffect, useRef } from "react";

// =================================================================================
// DECLARAÇÕES DE TIPO E CONFIGURAÇÃO INICIAL
// =================================================================================

// Tipos para a API de Reconhecimento de Fala do navegador
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Inicialização da API de Reconhecimento de Fala
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// =================================================================================
// ÍCONES EM SVG
// =================================================================================

interface IconProps {
  className?: string;
}

const BotIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 8V4H9V8H15Z" fill="currentColor" />
    <path d="M12 11C13.6569 11 15 9.65685 15 8V4H9V8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 14H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 19V17C20 15.6739 19.4732 14.4021 18.5355 13.4645C17.5979 12.5268 16.3261 12 15 12H9C7.67392 12 6.40215 12.5268 5.46447 13.4645C4.52678 14.4021 4 15.6739 4 17V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MicIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const StopIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect width="10" height="10" x="7" y="7" rx="1"></rect>
  </svg>
);


// =================================================================================
// COMPONENTE DA INTERFACE DE CHAT
// =================================================================================
type Msg = { from: "user" | "bot"; text: string };
const API_URL = "http://localhost:3000/chat"; // URL de exemplo da API

export default function ChatInterface() {
  const [userName, setUserName] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: "Hello! I am your AI English partner. Press the microphone button to start our conversation.",
    },
  ]);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastTranscript = useRef<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const listeningRef = useRef(listening);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);
  useEffect(() => {
    if (!recognition) {
      setError("SpeechRecognition not supported.");
      return;
    }
  
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
  
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {}
      } else {
        setListening(false);
      }
    };
    recognition.onerror = () => {
      if (listeningRef.current) {
        try {
          recognition.stop();
          recognition.start();
        } catch {}
      }
    };
    recognition.onresult = async (e: SpeechRecognitionEvent) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          t += e.results[i][0].transcript;
        }
      }
      t = t.trim();
      if (!t || t === lastTranscript.current) return;
      lastTranscript.current = t;
  
      setProcessing(true);
      const userMsg: Msg = { from: "user", text: t };
      setMsgs((prev) => [...prev, userMsg]);
  
      const history = [...msgs, userMsg].map((m) => ({
        role: m.from === "bot" ? "assistant" : "user",
        content: m.text,
      }));
  
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ history }),
        });
        if (!res.ok) throw new Error(res.statusText);
        const { reply } = await res.json();
        setMsgs((prev) => [...prev, { from: "bot", text: reply }]);
        const u = new SpeechSynthesisUtterance(reply);
        u.lang = "en-US";
        window.speechSynthesis.speak(u);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };
  
    try {
      if (!listeningRef.current) recognition.start();
    } catch {}
  
    return () => {
      recognition.stop();
    };
  }, []);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, processing]);

  const start = () => {
    setError(null);
    lastTranscript.current = "";
    recognition?.start();
  };

  const stop = () => {
    recognition?.stop();
    setListening(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-900">
      {/* Barra Lateral */}
      <aside className="w-64 bg-slate-800 p-4 flex flex-col space-y-4 border-r border-slate-700">
        <div className="text-2xl font-bold text-white">AI Practice</div>
        <button className="w-full text-left py-2 px-3 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors text-white font-semibold" disabled={true}>
          + New Chat
        </button>
        <div className="flex-1 space-y-2 overflow-y-auto">
          <p className="py-2 px-3 text-slate-300 rounded-md bg-slate-700/50">
            Conversation
          </p>
        </div>
        <div className="text-xs text-slate-500">Made with ❤️ for practice</div>
      </aside>

      {/* Seção Principal do Chat */}
      <section className="flex-1 flex flex-col">
        <header className="p-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between shadow-lg z-10">
          <h1 className="text-xl font-semibold text-white">English Conversation</h1>
          {processing && (
            <div className="text-sm text-indigo-400 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full"></div>
              <span>AI is thinking...</span>
            </div>
          )}
        </header>

        {/* Área de Mensagens */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {msgs.map((m, i) => (
            <div key={i} className={`flex items-start gap-4 max-w-xl ${m.from === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md text-white ${m.from === "bot" ? "bg-slate-700" : "bg-indigo-500"}`}>
                {m.from === "bot" ? <BotIcon /> : <UserIcon />}
              </div>
              <div className={`p-4 rounded-xl shadow-lg ${m.from === "user" ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none" : "bg-slate-700 text-slate-200 rounded-tl-none"}`}>
                <p className="text-base">{m.text}</p>
              </div>
            </div>
          ))}
          {error && (
            <div className="text-center p-3 bg-red-900/50 text-red-300 rounded-md border border-red-700/50">
              <strong>Error:</strong> {error}
            </div>
          )}
          <div ref={endRef} />
        </main>

        {/* Rodapé com o botão de Gravação */}
        <footer className="p-4 bg-slate-900">
          <div className="bg-slate-800 w-full max-w-3xl mx-auto rounded-full p-2 flex items-center shadow-2xl border border-slate-700">
            <p className="flex-1 px-4 text-slate-400">
              {listening ? "Listening... feel free to speak." : "Press the button to start speaking."}
            </p>
            <button
              onClick={listening ? stop : start}
              disabled={processing}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 disabled:bg-slate-600 disabled:cursor-not-allowed ${listening ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
            >
              {listening ? <StopIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}


