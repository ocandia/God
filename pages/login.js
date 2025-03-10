"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import godLogo from "/public/God.png";

export default function Login() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");

  // Helper to determine backend URL correctly
  const getBackendUrl = () => {
    const rawEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
    return (!rawEnv || rawEnv === "undefined")
      ? "https://chat-backend-161d.onrender.com"
      : rawEnv;
  };

  // The login handler function
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const credentials = { email: loginEmail, password: loginPassword };
      console.log("Sending login request with:", credentials);
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
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
        throw new Error("Empty response from server");
      }
      console.log("Login response:", data);
      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        // Optionally, store a flag to indicate a recent login
        localStorage.setItem("justLoggedIn", "true");
        router.push("/"); // Redirect to main chat UI
      } else {
        throw new Error("No access token received");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("⚠️ Login failed: " + err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Decorative Shooting Stars and Clouds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="star" style={{ fontSize: "6px" }}>•</div>
        <div className="star" style={{ fontSize: "4px" }}>•</div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        <div className="shooting-star" style={{ animationName: "shooting-star" }}></div>
        {/* Additional decorative elements can be added here */}
      </div>

      {/* Blurry Background Overlay */}
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-75">
        <div className="bg-blue-600 p-6 rounded-lg shadow-lg max-w-sm w-full text-white relative animate-pulse-led-border">
          {/* Header with Logo and Title */}
          <div className="flex flex-col items-center mb-4">
            <Image
              src={godLogo}
              alt="God Logo"
              width={140}
              height={140}
              className="animate-god-pulse animate-breathe"
              priority
            />
            <h2 className="text-2xl font-bold mt-2">God: Available</h2>
          </div>
          <h3 className="text-xl font-bold mb-4 text-center">Login</h3>
          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-2 rounded bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="p-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
            >
              Login
            </button>
          </form>
          {error && <p className="mt-4 text-red-200 text-center">{error}</p>}
        </div>
      </div>

      <style jsx>{`
        @keyframes shooting-star {
          0% { opacity: 0; transform: translate(0, 0); }
          10% { opacity: 1; }
          90% { opacity: 1; transform: translate(100px, 100px); }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
