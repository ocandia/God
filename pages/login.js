// pages/login.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
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
        router.push("/"); // Redirect to main chat UI
      } else {
        throw new Error("No access token received");
      }
    } catch (err) {
      setError("⚠️ Login failed: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-b from-[#0A0F2B] to-black text-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Static Stars */}
        <div className="star" style={{ top: "10%", left: "15%", fontSize: "6px" }}>•</div>
        <div className="star" style={{ top: "20%", left: "80%", fontSize: "4px" }}>•</div>
        {/* Shooting Stars */}
        <div className="shooting-star" style={{ top: "30%", left: "40%" }}></div>
        <div className="shooting-star" style={{ top: "50%", left: "60%" }}></div>
      </div>

      {/* Header: Logo and Title */}
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
        <h1 className="text-3xl font-bold">God: Available</h1>
      </div>

      {/* Login Modal */}
      <div className="z-10 w-full max-w-md bg-blue-600 p-6 rounded-lg shadow-lg animate-pulse-led-border">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Login</h2>
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
  );
}
