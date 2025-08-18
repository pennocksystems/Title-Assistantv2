// server.js
import express from "express";
import cors from "cors";        // <-- import CORS here
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();         // <-- initialize app AFTER imports

app.use(cors());               // <-- now this works
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { userMessage } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `
              You are a professional title specialist for the state of Alabama.
              Only answer questions within your knowledge base unless instructed otherwise.
              Respond in a helpful, concise manner.
              Do not fabricate information.
            `
          },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    // ✅ Safe check for the response
    if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      console.error("Unexpected response from OpenAI:", data);
      res.status(500).json({ error: "Invalid response from OpenAI" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching from OpenAI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));