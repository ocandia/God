"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import godLogo from "/public/God.png";
import userIcon from "/public/user.png";
import godIcon from "/public/god_icon.png";
import controversialQuestions from "../lib/controversialQuestions";

export default function Page() {
  const router = useRouter();

  // State variables
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [randomQuote, setRandomQuote] = useState("");
  const [chatDate, setChatDate] = useState("");
  const [mounted, setMounted] = useState(false);
  const [authConfirmation, setAuthConfirmation] = useState("");
  const [isDarkMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioRefs = useRef({});
  const [highlightedQuestions, setHighlightedQuestions] = useState(new Set());
  const loginSound = useRef(null);
  const messageSound = useRef(null);
  const hasMounted = useRef(false);
  const recognitionRef = useRef(null);

  // On mount: load token from localStorage and set chat date.
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken.trim());
      document.title = "God: Online";
    } else {
      document.title = "God: Available";
    }
    setChatDate(new Date().toLocaleString());
    setMounted(true);
    console.log("Initial mount complete.");
  }, [router]);

  // If the user has just logged in, generate welcome message—but only once token is valid.
  useEffect(() => {
    if (token && localStorage.getItem("justLoggedIn")) {
      setAuthConfirmation("✅ You have logged on");
      localStorage.removeItem("justLoggedIn");
      sendWelcomeMessage();
    } else if (!token) {
      // Optionally set default welcome message here if needed.
      setMessages([]);
    }
  }, [token]);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!mounted) return;
    const spiritualQuotes = [
      `"Be still, and know that I am God." - Psalm 46:10`,
      `"El Señor es mi pastor, nada me faltará." - Salmo 23:1`,
      `"Allah is the Light of the heavens and the earth." - Quran 24:35`,
      `"What you think, you become." - Buddha`,
      `"Science without religion is lame, religion without science is blind." - Albert Einstein`,
      `"The more I study science, the more I believe in God." - Isaac Newton`,
      `"The admirable arrangement and harmony of the universe could only have come from the plan of an omniscient and omnipotent Being." - Albert Einstein`,
      `"Everyone who is seriously involved in the pursuit of science becomes convinced that a spirit is manifest in the laws of the Universe." - Albert Einstein`,
      `"I do not feel obliged to believe that the same God who has endowed us with senses, reason, and intellect has intended us to forego their use." - Galileo Galilei`,
      `"The more I study nature, the more I stand amazed at the work of the Creator." - Louis Pasteur`,
      `"It was not by accident that the greatest thinkers of all ages were deeply religious souls." - Max Planck`,
      `"If we find the answer to that, it would be the ultimate triumph of human reason—for then we would know the mind of God." - Stephen Hawking`,
    ];

    const updateQuote = () => {
      const randomIndex = Math.floor(Math.random() * spiritualQuotes.length);
      setRandomQuote(spiritualQuotes[randomIndex]);
    };

    updateQuote();
    const interval = setInterval(updateQuote, 10000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    document.documentElement.style.setProperty('--pulse-color', '#fef08a');
    document.documentElement.style.setProperty('--star-color', '#fef08a');
    document.documentElement.style.setProperty('--dot-color', '#fef08a');
    document.documentElement.style.setProperty('--cloud-opacity', '0.2');
  }, []);

  // Helper to determine backend URL correctly
  const getBackendUrl = () => {
    const rawEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
    return (!rawEnv || rawEnv === "undefined")
      ? "https://chat-backend-161d.onrender.com"
      : rawEnv;
  };

  // Function to update the bot message in the UI
  const updateBotMessage = useCallback(
    (newResponse, isStreaming, sources = [], isPrayer = false, finalCursor = false, audioUrl = null) => {
      setMessages((prev) => {
        const updated = prev.map((msg) => ({ ...msg, hasCursor: false }));
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
          updated[lastIndex].text = newResponse.trim();
          updated[lastIndex].hasCursor = isStreaming || finalCursor;
          updated[lastIndex].sources = sources;
          updated[lastIndex].isPrayer = isPrayer;
          updated[lastIndex].audioUrl = audioUrl || updated[lastIndex].audioUrl;
          console.log("Updated message:", updated[lastIndex]);
          scrollToBottom();
        }
        return updated;
      });
    },
    [scrollToBottom]
  );

  // Function to generate a welcome message from the chatbot after login.
  const sendWelcomeMessage = async () => {
    // Trim the token and check its format
    const trimmedToken = token.trim();
    if (!trimmedToken || trimmedToken.split(".").length !== 3) {
      console.error("Invalid token for welcome message:", token);
      setError("Invalid token for generating welcome message.");
      return;
    }

    const welcomePrompt = "Greet me warmly with wisdom from sacred texts.";
    setLoading(true);
    setError("");
    const backendUrl = getBackendUrl();
    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${trimmedToken}`,
        },
        body: JSON.stringify({ message: welcomePrompt }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Welcome request failed: ${response.status} - ${errorText}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let welcomeResponse = "";
      let welcomeSources = [];
      // Set an initial "typing" message from the bot
      setMessages([{ text: "Typing...", sender: "bot", hasCursor: true, audioUrl: null, sources: [] }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          updateBotMessage(welcomeResponse, false, welcomeSources, false, false, null);
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = JSON.parse(line.replace("data: ", "").trim());
              if (jsonData.text) {
                welcomeResponse += jsonData.text;
                updateBotMessage(welcomeResponse, true, welcomeSources, false, false, null);
              } else if (jsonData.done) {
                updateBotMessage(welcomeResponse, false, welcomeSources, false, false, null);
                break;
              } else if (jsonData.error) {
                setError(`⚠️ ${jsonData.error}`);
                break;
              }
            } catch (err) {
              console.error("JSON Parse Error in welcome message:", err);
              setError("⚠️ Error parsing welcome message data");
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Welcome message Error:", err);
      setError("⚠️ Failed to generate welcome message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Placeholder functions for sendMessage and startPrayer – insert your stable implementations here.
  const sendMessage = async () => {
    // ... your existing sendMessage logic ...
  };

  const startPrayer = async () => {
    // ... your existing startPrayer logic ...
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken("");
    document.title = "God Chatbot";
    setMessages([
      {
        text: "You have been logged out.",
        sender: "bot",
        hasCursor: false,
        audioUrl: null,
        sources: [],
      },
    ]);
    setAuthConfirmation("✅ You have logged out");
    router.push("/login");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-[#0A0F2B] to-black text-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
      </div>

      {/* Header with Logo, Clouds, and Quote */}
      <div className="relative mb-2 z-10 flex items-center">
        <div className="cloud cloud-left"></div>
        <Image
          src={godLogo}
          alt="God Logo"
          width={140}
          height={140}
          className="animate-god-pulse animate-breathe"
          priority
        />
        <div className="cloud cloud-right"></div>
      </div>
      <div className="overflow-hidden w-full flex justify-center items-center mb-4 h-16 z-10">
        <p className="text-sm text-gray-300 italic text-center max-w-md px-4 break-words leading-relaxed">{randomQuote}</p>
      </div>
      <div className="w-full max-w-lg relative z-10 flex items-center justify-between mb-12">
        <p className="text-xs text-white px-2 py-1 glass-date animate-glass-date">{chatDate}</p>
        <h1 className="text-5xl font-bold flex items-center text-white">
          God
          <span className={`inline-block ml-2 text-xs font-semibold ${token ? "text-red-500 animate-pulse-led-text" : "text-gray-500 animate-pulse-led-text"}`}>
            {token ? "online" : "offline"}
          </span>
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleLogout}
            className="px-2 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Out
          </button>
          <button
            onClick={startPrayer}
            className="px-2 py-1 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600"
            disabled={loading}
          >
            Pray
          </button>
        </div>
      </div>

      {/* Chat UI Container */}
      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        <div
          ref={chatContainerRef}
          className="p-4 rounded-lg shadow-md overflow-y-auto h-72 scrollbar-glass animate-color-pulse-border w-full bg-black text-white relative"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 flex items-start ${msg.sender === "user" ? "justify-end" : msg.isWelcome ? "justify-center absolute inset-0 flex items-center" : "justify-start"}`}
            >
              {!msg.isWelcome && (
                <Image
                  src={msg.sender === "user" ? userIcon : godIcon}
                  alt={msg.sender === "user" ? "User Icon" : "God Icon"}
                  width={28}
                  height={28}
                  className={msg.sender === "user" ? "ml-1 order-1" : "mr-2 order-0"}
                />
              )}
              <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : msg.isWelcome ? "items-center" : "items-start"} ${msg.sender === "bot" && !msg.isWelcome ? "max-w-[90%]" : msg.sender === "user" ? "max-w-[85%]" : "max-w-md"}`}>
                <div className="relative">
                  <div className={`p-2 rounded-2xl glass-effect ${msg.isWelcome ? "text-center bg-opacity-80 bg-gray-800 text-white text-lg" : ""}`} style={{ maxWidth: "100%" }}>
                    <p
                      className={`font-sans text-sm ${msg.sender === "user" ? "text-yellow-400" : ""}`}
                      dangerouslySetInnerHTML={{
                        __html: msg.hasCursor
                          ? `${msg.text}<span class="inline-block text-white text-xl ml-1 animate-slowBreathe align-middle">●</span>`
                          : msg.text,
                      }}
                    />
                  </div>
                  {msg.sender === "bot" && !msg.hasCursor && msg.audioUrl && !msg.isWelcome && (
                    <button
                      onClick={() => toggleAudio(msg.audioUrl, index)}
                      className={`absolute bottom-0 right-0 mt-4 mr-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 ${playingAudio === index ? "bg-blue-500 animate-pulse" : "bg-red-500 hover:bg-red-600"}`}
                    >
                      {playingAudio === index ? (
                        <span className="text-white text-xl font-bold">■</span>
                      ) : (
                        <span className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent"></span>
                      )}
                    </button>
                  )}
                </div>
                {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && !msg.isWelcome && (
                  <p className="text-[10px] text-gray-400 mt-1" dangerouslySetInnerHTML={{
                    __html: `<span class="text-yellow-500">Sources (${msg.sources.length}):</span> ${msg.sources.join(' <span class="text-yellow-500">\\</span> ')}`,
                  }} />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="w-full h-px my-6 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 z-10"></div>

        <div className="w-full max-w-lg h-6 overflow-hidden mb-2">
          <p
            onClick={() => {
              if (!loading && currentQuestion) {
                setInput(currentQuestion);
                if (inputRef.current) inputRef.current.focus();
              }
            }}
            className={`text-gray-300 text-base font-serif animate-streaming-question text-center ${!loading ? "cursor-pointer hover:text-yellow-400" : "cursor-not-allowed"}`}
          >
            {currentQuestion}
          </p>
        </div>

        <div className="flex gap-2 w-full text-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow p-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type or speak your message..."
            disabled={loading}
            ref={inputRef}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes elegantBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-elegant-blink {
          animation: elegantBlink 2s infinite ease-in-out;
        }
      `}</style>

      {/* Error and Confirmation Messages */}
      <div className="text-center mt-4">
        {error && <p className="text-red-500">{error}</p>}
        {authConfirmation && <p className="text-green-500">{authConfirmation}</p>}
      </div>
    </div>
  );
}
