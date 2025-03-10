// pages/login.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const credentials = { email: loginEmail, password: loginPassword };
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const rawResponse = await res.text();
      let data = {};
      if (rawResponse) {
        data = JSON.parse(rawResponse);
      } else {
        throw new Error("Empty response from server");
      }
      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        router.push("/"); // Redirect to main chat page
      } else {
        throw new Error("No access token received");
      }
    } catch (err) {
      setError("⚠️ Login failed: " + err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Decorative Elements: Shooting Stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="shooting-star" style={{ top: "10%", left: "20%" }}></div>
        <div className="shooting-star" style={{ top: "30%", left: "70%" }}></div>
        <div className="shooting-star" style={{ top: "60%", left: "40%" }}></div>
        {/* Add additional shooting star divs as needed */}
      </div>
      {/* Blurry Background Overlay */}
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
