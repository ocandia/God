// pages/index.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  
  // State variables
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [authConfirmation, setAuthConfirmation] = useState("");

  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      // If no token, redirect to login page
      router.push("/login");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  // Helper to determine backend URL correctly
  const getBackendUrl = () => {
    const rawEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
    return (!rawEnv || rawEnv === "undefined")
      ? "https://chat-backend-161d.onrender.com"
      : rawEnv;
  };

  // Update bot message in the UI
  const updateBotMessage = (text, hasCursor, sources, isPrayer, _unused, audioUrl) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = {
        text,
        sender: "bot",
        hasCursor,
        audioUrl,
        sources,
        isPrayer,
      };
      return newMessages;
    });
  };

  // Scroll to the bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // sendMessage and startPrayer functions (keep your existing implementations)
  const sendMessage = async () => {
    // ...existing sendMessage code...
  };

  const startPrayer = async () => {
    // ...existing startPrayer code...
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F2B] to-black text-white">
      {/* Header with Logo and Title */}
      <header className="mb-4 flex flex-col items-center">
        <img
          src="/logo.png" // Ensure logo.png exists in the public folder
          alt="Logo"
          className="w-32 h-32"
        />
        <h2 className="text-2xl font-bold mt-2">God: Available</h2>
      </header>

      {/* Main Chat UI Container */}
      <main className="mx-auto max-w-2xl h-[70vh] bg-gray-900 rounded-lg shadow-lg p-4">
        <div className="flex-1 overflow-y-auto break-words" id="chat-container">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.sender === "user" ? "bg-blue-600" : "bg-gray-700"
                } ${msg.isPrayer ? "border-l-4 border-blue-900" : ""} break-words`}
              >
                <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                {msg.sources && msg.sources.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Sources: {msg.sources.join(", ")}
                  </div>
                )}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            ref={inputRef}
            className="flex-grow p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white break-words"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`p-2 rounded ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : "Send"}
          </button>
          <button
            onClick={startPrayer}
            disabled={loading}
            className={`p-2 rounded ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Pray
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              setToken("");
              setMessages([]);
              setAuthConfirmation("");
              document.title = "God Chatbot";
              router.push("/login");
            }}
            className="p-2 bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </main>

      {/* Error and Confirmation Messages */}
      <div className="text-center mt-4">
        {error && <p className="text-red-500">{error}</p>}
        {authConfirmation && <p className="text-green-500">{authConfirmation}</p>}
      </div>
    </div>
  );
}
