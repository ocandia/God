// Force redeploy with backend URL fallback - March 08, 2025
"use client"; // Required for client-side logic in Next.js App Router or legacy pages with client features

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  // State variables from your functions
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [authConfirmation, setAuthConfirmation] = useState("");

  // Refs from your functions
  const loginSound = useRef(null);
  const messageSound = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Simulated controversialQuestions from deployed bundle
  const controversialQuestions = [
    "If God is all-powerful, why does evil exist?",
    "Does God predetermine our fates, or do we have free will?",
    // Add more as needed...
  ];

  // Placeholder functions referenced in your code
  const generateAudio = async (text) => {
    // Replace with actual implementation if available
    return null;
  };

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Your provided functions
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const credentials = { email: loginEmail, password: loginPassword };
      console.log("Sending login request with:", credentials);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://chat-backend-161d.onrender.com';
      const res = await fetch(`${backendUrl}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
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
        setShowLoginPopup(false);
        setLoginEmail("");
        setLoginPassword("");

        const introMessage = "Greetings, seeker of truth. I’m here to guide you with God’s wisdom, drawn from His sacred words.";
        setMessages([{ text: introMessage, sender: "bot", hasCursor: false, audioUrl: null, sources: [] }]);
        if (loginSound.current) {
          loginSound.current.play().catch((err) => console.error("Login sound error:", err));
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("⚠️ Login failed: " + err.message);
    }
  };

  const sendMessage = async () => {
    let messageToSend = input.trim();
    if (!messageToSend) {
      const randomIndex = Math.floor(Math.random() * controversialQuestions.length);
      messageToSend = controversialQuestions[randomIndex];
      setInput(messageToSend);
    }

    const displayedMessage = messageToSend;
    const messageToSendBackend = `${messageToSend} Provide a concise reply (1-2 sentences) based on the provided knowledge and documentation.`;

    setLoading(true);
    setError("");

    const userMessage = { text: displayedMessage, sender: "user", hasCursor: false, audioUrl: null };
    setMessages((prev) => {
      const hasUserMessage = prev.some((msg) => msg.sender === "user");
      if (!hasUserMessage) {
        return [userMessage];
      }
      return [...prev, userMessage];
    });

    console.log("Token being sent:", token);
    if (!token) {
      setError("⚠️ You need to log in first.");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending message to backend:", messageToSendBackend);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://chat-backend-161d.onrender.com';
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageToSendBackend }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat request failed: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";
      let botSources = [];
      let botMessage = { text: "Typing...", sender: "bot", hasCursor: true, audioUrl: null, sources: [] };

      setMessages((prev) => [...prev, botMessage]);
      scrollToBottom();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Stream completed via reader 'done'");
          const audioUrl = await generateAudio(botResponse);
          updateBotMessage(botResponse, false, botSources, false, false, audioUrl);
          if (messageSound.current) {
            messageSound.current.play().catch((err) => console.error("Message sound error:", err));
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = JSON.parse(line.replace("data: ", "").trim());
              if (jsonData.sources) {
                botSources = jsonData.sources;
                updateBotMessage(botResponse, true, botSources, false, false, null);
              } else if (jsonData.text) {
                botResponse += jsonData.text;
                updateBotMessage(botResponse, true, botSources, false, false, null);
                await new Promise((resolve) => setTimeout(resolve, 80));
                scrollToBottom();
              } else if (jsonData.done) {
                console.log("Received 'done' signal from stream");
                const audioUrl = await generateAudio(botResponse);
                updateBotMessage(botResponse, false, botSources, false, false, audioUrl);
                break;
              } else if (jsonData.error) {
                setError(`⚠️ ${jsonData.error}`);
                break;
              }
            } catch (err) {
              console.error("JSON Parse Error:", err);
              setError("⚠️ Error parsing stream data");
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("SendMessage Error:", err);
      setError("⚠️ Failed to get a response from chatbot: " + err.message);
    } finally {
      setLoading(false);
      setInput("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const startPrayer = async () => {
    if (!token) {
      setError("⚠️ You need to log in first.");
      return;
    }

    setLoading(true);
    const recentMessages = messages.filter((msg) => msg.sender === "user").slice(-5).map((msg) => msg.text).join("; ");
    const prayerPrompt = `Provide a short prayer (3-5 sentences) relevant to the current discussion: "${recentMessages}". Incorporate any names and specifics mentioned by the user, using wisdom from the provided religious texts.`;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://chat-backend-161d.onrender.com';
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message: prayerPrompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prayer request failed: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let prayerResponse = "";
      let prayerSources = [];
      let prayerMessage = {
        text: "<span class='bg-blue-900 text-white text-xs px-1 py-0.5 rounded mr-1 inline-flex items-center animate-prayer-pulse'><span class='mr-1'>🙏</span>Prayer</span>Praying...",
        sender: "bot",
        hasCursor: true,
        audioUrl: null,
        sources: [],
        isPrayer: true,
      };

      setMessages((prev) => [...prev, prayerMessage]);
      scrollToBottom();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          const audioUrl = await generateAudio(prayerResponse);
          updateBotMessage(prayerResponse, false, prayerSources, true, false, audioUrl);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = JSON.parse(line.replace("data: ", "").trim());
              if (jsonData.sources) {
                prayerSources = jsonData.sources;
                updateBotMessage(prayerResponse, true, prayerSources, true, false, null);
              } else if (jsonData.text) {
                prayerResponse += jsonData.text;
                updateBotMessage(prayerResponse, true, prayerSources, true, false, null);
                await new Promise((resolve) => setTimeout(resolve, 80));
                scrollToBottom();
              } else if (jsonData.done) {
                const audioUrl = await generateAudio(prayerResponse);
                updateBotMessage(prayerResponse, false, prayerSources, true, false, audioUrl);
                break;
              }
            } catch (err) {
              console.error("JSON Parse Error:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Prayer Error:", err);
      setError("⚠️ Failed to generate prayer from resources.");
    }
    setLoading(false);
  };

  // Basic UI (expand as needed)
  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-[#0A0F2B] to-black text-white">
      <h1>God Chatbot</h1>
      {error && <p className="text-red-500">{error}</p>}
      {authConfirmation && <p className="text-green-500">{authConfirmation}</p>}
      
      {!token && (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      )}

      {token && (
        <>
          <div>
            {messages.map((msg, index) => (
              <p key={index}>{msg.sender}: {msg.text}</p>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            ref={inputRef}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
          <button onClick={startPrayer} disabled={loading}>Pray</button>
          <button onClick={() => {
            localStorage.removeItem("access_token");
            setToken("");
            setMessages([]);
          }}>Logout</button>
        </>
      )}
    </div>
  );
}