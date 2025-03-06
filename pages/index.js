"use client";

import Image from "next/image";
import godLogo from "/public/God.png";
import userIcon from "/public/user.png";
import godIcon from "/public/god_icon.png";
import { useEffect, useState, useRef, useCallback } from "react";
import controversialQuestions from "../lib/controversialQuestions"; // Import the questions

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [randomQuote, setRandomQuote] = useState("");
  const [chatDate, setChatDate] = useState("");
  const [mounted, setMounted] = useState(false);
  const [authConfirmation, setAuthConfirmation] = useState("");
  const [isDarkMode] = useState(true); // Fixed to dark mode, no toggle
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const hasMounted = useRef(false);
  const audioRefs = useRef({});
  const [highlightedQuestions, setHighlightedQuestions] = useState(new Set());

  const loginSound = useRef(null);
  const messageSound = useRef(null);

  useEffect(() => {
    if (!mounted) return;

    const updateQuestion = () => {
      const randomIndex = Math.floor(Math.random() * controversialQuestions.length);
      setCurrentQuestion(controversialQuestions[randomIndex]);
    };

    updateQuestion();
    const interval = setInterval(updateQuestion, 8000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    console.log("Initializing client-side resources");
    loginSound.current = new Audio("/login.mp3");
    messageSound.current = new Audio("/message.mp3");

    const link = document.querySelector("link[rel*='icon']") || document.createElement("link");
    link.type = "image/png";
    link.rel = "icon";
    link.href = "/God.png";
    document.head.appendChild(link);

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError("⚠️ Speech recognition failed. Please try again.");
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        } else {
          setIsRecording(false);
        }
      };
    } else {
      console.warn("SpeechRecognition not supported in this browser.");
    }

    setMounted(true);
  }, [mounted, isRecording]);

  useEffect(() => {
    if (authConfirmation) {
      const timer = setTimeout(() => setAuthConfirmation(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [authConfirmation]);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      document.title = "God: Online";
    } else {
      document.title = "God: Available";
    }

    setChatDate(new Date().toLocaleString());
    setMessages([
      {
        text: `Welcome, seeker of divine wisdom. Ask me anything, and I shall respond with truth from sacred texts.<br/><span class="text-3xl">God</span> <span class="text-red-500 text-sm animate-elegant-blink">online</span>`,
        sender: "bot",
        hasCursor: false,
        audioUrl: null,
        isWelcome: true,
      },
    ]);
    setMounted(true);

    console.log("Setting initial tab title and welcome message");
  }, []);

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
    document.documentElement.style.setProperty('--pulse-color', '#fef08a'); // Fixed for dark mode
    document.documentElement.style.setProperty('--star-color', '#fef08a');
    document.documentElement.style.setProperty('--dot-color', '#fef08a');
    document.documentElement.style.setProperty('--cloud-opacity', '0.2');
  }, []);

  const generateAudio = async (text) => {
    try {
      console.log("Generating audio for text:", text);
      const response = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("Audio URL generated:", audioUrl);
      return audioUrl;
    } catch (err) {
      console.error("Failed to generate audio:", err);
      setError(`⚠️ Failed to generate audio: ${err.message}`);
      return null;
    }
  };

  const toggleAudio = (audioUrl, index) => {
    if (!audioUrl) {
      console.error("No audio URL available for index:", index);
      setError("⚠️ No audio available to play.");
      return;
    }

    const audio = audioRefs.current[index] || new Audio(audioUrl);
    audioRefs.current[index] = audio;

    if (playingAudio === index) {
      audio.pause();
      setPlayingAudio(null);
      console.log("Audio paused for index:", index);
    } else {
      if (playingAudio !== null) {
        const prevAudio = audioRefs.current[playingAudio];
        prevAudio.pause();
      }
      audio.play()
        .then(() => {
          console.log("Playing audio:", audioUrl);
          setPlayingAudio(index);
          audio.onended = () => {
            setPlayingAudio(null);
            console.log("Audio ended for index:", index);
          };
        })
        .catch((err) => {
          console.error("Playback error:", err);
          setError("⚠️ Failed to play audio: " + err.message);
        });
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError("⚠️ Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsRecording(true);
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
    console.log("Request headers:", {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });
    if (!token) {
      setError("⚠️ You need to log in first.");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending message to backend:", messageToSendBackend);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
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
          console.log("Streaming complete, final response:", botResponse, "Audio URL:", audioUrl);
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
      console.log("Resetting loading state");
      setLoading(false);
      setInput("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleLogin = async () => {
    try {
      const credentials = { email: "user123@example.com", password: "password123" };
      console.log("Sending login request with:", credentials);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      console.log("Login response:", data);
      if (!res.ok) {
        throw new Error("Login failed");
      }
      if (data.access_token) {
        console.log("Setting token:", data.access_token);
        localStorage.setItem("access_token", data.access_token);
        setToken(data.access_token);
        document.title = "God: Online";
        setError("");
        setAuthConfirmation("✅ You have logged on");

        const introMessage = "Greetings, seeker of truth. I’m here to guide you with God’s wisdom, drawn from His sacred words.";
        setMessages([{ text: introMessage, sender: "bot", hasCursor: false, audioUrl: null, sources: [] }]);
        if (loginSound.current) {
          loginSound.current.play().catch((err) => console.error("Login sound error:", err));
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("⚠️ Login failed. Check credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken("");
    document.title = "God: Available";
    setMessages([{ text: "You have been logged out.", sender: "bot", hasCursor: false, audioUrl: null, sources: [] }]);
    setAuthConfirmation("✅ You have logged out");
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const updateBotMessage = useCallback(
    (newResponse, isStreaming, sources = [], isPrayer = false, finalCursor = false, audioUrl = null) => {
      setMessages((prev) => {
        const updated = prev.map((msg) => ({ ...msg, hasCursor: false }));
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
          const citationRegex = /(\d*\s*[A-Za-z]+\s*\d+:\d+)/g;
          const citationMatches = [...new Set(newResponse.match(citationRegex) || [])];
          let formattedText = newResponse;
          citationMatches.forEach((citation) => {
            const regex = new RegExp(`(${citation})`, "g");
            formattedText = formattedText.replace(regex, `<span class="text-red-500">$1</span>`);
          });

          const parts = formattedText.split(/(<span class="text-red-500">.*?<\/span>)/g);
          formattedText = "";
          parts.forEach((part) => {
            if (part.startsWith('<span class="text-red-500">')) {
              formattedText += part;
            } else if (part.trim()) {
              const sentences = part.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
              sentences.forEach((sentence, sentIndex) => {
                const isQuestion = sentence.trim().endsWith("?");
                const questionKey = `${lastIndex}-${sentIndex}-${sentence}`;
                if (isQuestion && !isStreaming) {
                  if (!highlightedQuestions.has(questionKey)) {
                    setHighlightedQuestions((prevSet) => {
                      const newSet = new Set(prevSet);
                      newSet.add(questionKey);
                      return newSet;
                    });
                    setTimeout(() => {
                      setHighlightedQuestions((prevSet) => {
                        const newSet = new Set(prevSet);
                        newSet.delete(questionKey);
                        return newSet;
                      });
                    }, 5000);
                  }
                  const questionClass = highlightedQuestions.has(questionKey)
                    ? "animate-pulse-opacity"
                    : "text-yellow-600 italic";
                  formattedText += `<span class="${questionClass}">${sentence}</span> `;
                } else {
                  formattedText += `${sentence} `;
                }
              });
            }
          });

          if (isPrayer) {
            formattedText = `<span class="bg-blue-900 text-white text-xs px-1 py-0.5 rounded mr-1 inline-flex items-center animate-prayer-pulse"><span class="mr-1">🙏</span>Prayer</span>${formattedText.trim()}`;
          } else {
            formattedText = formattedText.trim();
          }

          updated[lastIndex].text = formattedText;
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
    [loading, highlightedQuestions, isDarkMode, scrollToBottom]
  );

  useEffect(() => {
    if (!mounted) return;
    const stars = document.querySelectorAll(".star");
    console.log("Static stars useEffect running, stars found:", stars.length);
    const updateStarPositions = () => {
      stars.forEach((star) => {
        const top = 10 + Math.random() * 30;
        const left = 30 + Math.random() * 40;
        star.style.top = `${top}%`;
        star.style.left = `${left}%`;
      });
    };

    updateStarPositions();
    const interval = setInterval(updateStarPositions, 20000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const shootingStars = document.querySelectorAll(".shooting-star");
    console.log("Shooting stars useEffect running, stars found:", shootingStars.length);
    if (!shootingStars.length) return;

    const updatePositions = () => {
      shootingStars.forEach((star, index) => {
        const movement = Math.floor(Math.random() * 4);
        let startTop, startLeft, endTop, endLeft;

        switch (movement) {
          case 0:
            startTop = -10;
            startLeft = -10;
            endTop = 110;
            endLeft = 110;
            break;
          case 1:
            startTop = -10;
            startLeft = Math.random() * 100;
            endTop = 110;
            endLeft = startLeft;
            break;
          case 2:
            startTop = 110;
            startLeft = Math.random() * 100;
            endTop = -10;
            endLeft = startLeft;
            break;
          case 3:
            startTop = 40 + Math.random() * 20;
            startLeft = 40 + Math.random() * 20;
            endTop = startTop + (Math.random() * 20 - 10);
            endLeft = startLeft + (Math.random() * 20 - 10);
            break;
        }

        star.style.setProperty("--start-top", `${startTop}%`);
        star.style.setProperty("--start-left", `${startLeft}%`);
        star.style.setProperty("--end-top", `${endTop}%`);
        star.style.setProperty("--end-left", `${endLeft}%`);
        star.style.animationDuration = `${25 + index * 3}s`;
        const colors = ["#FFFF00", "#FFD700", "#FFFFFF", "#FFFACD", "#F0E68C"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        star.style.backgroundColor = randomColor;
        star.style.boxShadow = `0 0 20px 10px rgba(255, 255, 255, 0.5)`;
      });
    };

    updatePositions();
    const interval = setInterval(updatePositions, 2000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const dots = document.querySelectorAll(".background-dot");
    console.log("Background dots useEffect running, dots found:", dots.length);
    const updateDotPositions = () => {
      dots.forEach((dot) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        dot.style.top = `${top}%`;
        dot.style.left = `${left}%`;
        dot.style.animationDelay = `${Math.random() * 5}s`;
      });
    };

    updateDotPositions();
    const interval = setInterval(updateDotPositions, 20000);
    return () => clearInterval(interval);
  }, [mounted]);

  const handleQuestionClick = () => {
    if (currentQuestion && !loading) {
      setInput(currentQuestion);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-[#0A0F2B] to-black text-white">
        <div className="relative mb-2">
          <Image src={godLogo} alt="God Logo" width={140} height={140} className="animate-god-pulse animate-breathe" priority />
          <div className="cloud cloud-left"></div>
          <div className="cloud cloud-right"></div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-[#0A0F2B] to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="star" style={{ fontSize: "8px" }}>•</div>
        <div className="star" style={{ fontSize: "5px" }}>•</div>
        <div className="star" style={{ fontSize: "7px" }}>•</div>
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="star" style={{ fontSize: "8px" }}>•</div>
        <div className="star" style={{ fontSize: "5px" }}>•</div>
        <div className="star" style={{ fontSize: "7px" }}>•</div>
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="star" style={{ fontSize: "8px" }}>•</div>
        <div className="star" style={{ fontSize: "5px" }}>•</div>
        <div className="star" style={{ fontSize: "7px" }}>•</div>
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="star" style={{ fontSize: "8px" }}>•</div>
        <div className="star" style={{ fontSize: "5px" }}>•</div>
        <div className="star" style={{ fontSize: "7px" }}>•</div>
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="star" style={{ fontSize: "8px" }}>•</div>
        <div className="star" style={{ fontSize: "5px" }}>•</div>
        <div className="star" style={{ fontSize: "7px" }}>•</div>
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="star" style={{ fontSize: "8px" }}>•</div>
        <div className="star" style={{ fontSize: "5px" }}>•</div>
        <div className="star" style={{ fontSize: "7px" }}>•</div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "5px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "4px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "6px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "3px" }}>•</div>
        <div className="background-dot" style={{ fontSize: "7px" }}>•</div>
      </div>

      <div className="relative mb-2 z-10 flex items-center">
        <div className="cloud cloud-left"></div>
        <Image src={godLogo} alt="God Logo" width={140} height={140} className="animate-god-pulse animate-breathe" priority />
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
          {token ? (
            <button
              onClick={handleLogout}
              className="px-2 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Out
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-2 py-1 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600"
            >
              In
            </button>
          )}
          <button
            onClick={startPrayer}
            className="px-2 py-1 text-sm rounded-lg bg-purple-500 text-white hover:bg-purple-600"
            disabled={loading}
          >
            Pray
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-2 z-10">{error}</p>}
      {authConfirmation && <p className="text-green-500 mb-2 animate-fade-out z-10">{authConfirmation}</p>}

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        <div
          ref={chatContainerRef}
          className="p-4 rounded-lg shadow-md overflow-y-auto h-72 scrollbar-glass animate-color-pulse-border w-full bg-black text-white relative"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 flex items-start ${
                msg.sender === "user" ? "justify-end" : msg.isWelcome ? "justify-center absolute inset-0 flex items-center" : "justify-start"
              }`}
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
              <div
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : msg.isWelcome ? "items-center" : "items-start"} ${
                  msg.sender === "bot" && !msg.isWelcome ? "max-w-[90%]" : msg.sender === "user" ? "max-w-[85%]" : "max-w-md"
                }`}
              >
                <div className="relative">
                  <div
                    className={`p-2 rounded-2xl glass-effect ${msg.isWelcome ? "text-center bg-opacity-80 bg-gray-800 text-white text-lg" : ""}`}
                    style={{ maxWidth: "100%" }}
                  >
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
                      className={`absolute bottom-0 right-0 mt-4 mr-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 ${
                        playingAudio === index ? "bg-blue-500 animate-pulse" : "bg-red-500 hover:bg-red-600"
                      }`}
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
                  <p
                    className="text-[10px] text-gray-400 mt-1"
                    dangerouslySetInnerHTML={{
                      __html: `<span class="text-yellow-500">Sources (${msg.sources.length}):</span> ${msg.sources.join(' <span class="text-yellow-500">\\</span> ')}`,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="w-full h-px my-6 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 z-10"></div>

        <div className="w-full max-w-lg h-6 overflow-hidden mb-2">
          <p
            onClick={handleQuestionClick}
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
            onClick={toggleRecording}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-white text-xs font-semibold hover:opacity-80 ${
              isRecording ? "bg-blue-500" : "bg-red-500"
            } ${isRecording ? "animate-pulse" : ""}`}
            disabled={loading}
          >
            {isRecording ? <span>■</span> : "Rec"}
          </button>
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
    </div>
  );
}