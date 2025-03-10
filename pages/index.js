// Force redeploy with backend URL fallback - March 08, 2025
"use client"; // Required for client-side logic in Next.js

import { useState, useRef } from "react";

export default function Home() {
  // State variables
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authConfirmation, setAuthConfirmation] = useState("");

  // Refs
  const loginSound = useRef(null);
  const messageSound = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Simulated controversial questions
  const controversialQuestions = [
    "If God is all-powerful, why does evil exist?",
    "Does God predetermine our fates, or do we have free will?",
    // Add more as needed...
  ];

  // Placeholder for audio generation (replace with actual implementation if available)
  const generateAudio = async (text) => {
    return null;
  };

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

  // Handle login and fetch chat history
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const credentials = { email: loginEmail, password: loginPassword };
      console.log("Sending login request with:", credentials);
      const backendUrl = getBackendUrl();
      console.log("Using backend URL:", backendUrl);
      const res = await fetch(`${backendUrl}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      // Get raw response text for debugging
      const rawResponse = await res.text();
      console.log("Raw response text:", rawResponse);

      let data = {};
      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        console.error("Empty response from server");
        throw new Error("Empty response from server");
      }

      console.log("Login response:", data);
      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }
      if (data.access_token) {
        console.log("Setting token:", data.access_token);
        localStorage.setItem("access_token", data.access_token);
        setToken(data.access_token);
        document.title = "God: Online";
        setError("");
        setAuthConfirmation("✅ You have logged on");
        setLoginEmail("");
        setLoginPassword("");
        // Optionally, fetch chat history here
      } else {
        console.error("No access_token in response:", data);
        setError("⚠️ Login failed: No access token received");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("⚠️ Login failed: " + err.message);
    }
  };

  // sendMessage and startPrayer remain unchanged (omitted for brevity)
  const sendMessage = async () => {
    // ...existing sendMessage implementation...
  };

  const startPrayer = async () => {
    // ...existing startPrayer implementation...
  };

  // Render login modal overlay independently if not logged in.
  if (!token) {
    return (
      <div className="relative min-h-screen bg-black">
        {/* Shooting stars overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="shooting-star" style={{ top: "10%", left: "20%" }}></div>
          <div className="shooting-star" style={{ top: "30%", left: "70%" }}></div>
          <div className="shooting-star" style={{ top: "60%", left: "40%" }}></div>
          {/* Add more shooting stars as needed */}
        </div>
        {/* Login Modal Overlay */}
        <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-75">
          <div className="relative bg-blue-600 p-6 rounded-lg shadow-lg max-w-md w-full animate-pulse-led-border">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Login</h3>
            <form onSubmit={handleLogin} className="flex flex-col space-y-4">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                required
                className="p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                required
                className="p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-800 rounded text-white hover:bg-blue-900 transition"
              >
                Login
              </button>
            </form>
            {error && <p className="mt-4 text-red-200 text-center">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Render full chat UI when logged in.
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
