// frontend/nextjs-app/pages/api/synthesize.js
import axios from "axios";
import https from "https";

export default async function handler(req, res) {
  console.log("API /synthesize called with:", req.body);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  console.log("ELEVENLABS_API_KEY:", apiKey ? "Set" : "Missing");
  console.log("VOICE_ID: cl1s9AdfeCxjneiZAPLR");
  console.log("Attempting axios request to ElevenLabs...");

  if (!apiKey) {
    return res.status(500).json({ error: "ELEVEN_LABS_API_KEY not set" });
  }

  try {
    const response = await axios({
      method: "POST",
      url: "https://api.elevenlabs.io/v1/text-to-speech/cl1s9AdfeCxjneiZAPLR",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      data: {
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.9, similarity_boost: 0.9 },
      },
      responseType: "arraybuffer",
      httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Bypass SSL verification
    });

    const audioBuffer = Buffer.from(response.data);
    console.log("Audio generated successfully, size:", audioBuffer.length);
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error("Detailed error:", err.message, err.response ? err.response.data : "No response data");
    res.status(500).json({ error: "Failed to generate audio", details: err.message });
  }
}