import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Serve form and data files
app.use("/forms", express.static(path.join(__dirname, "forms")));
app.use("/data", express.static(path.join(__dirname, "data")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Client record lookup route (with logging)
app.post("/check-client", (req, res) => {
  const { phone, email } = req.body;
  const results = [];

  console.log("🔍 Incoming /check-client request:", req.body);

  fs.createReadStream(path.join(__dirname, "data", "client_data.csv"))
    .pipe(csv())
    .on("data", (data) => {
      console.log("📄 Parsed row:", data);
      const csvPhone = data["client phone"]?.replace(/\D/g, '');
      const csvEmail = data["client email"]?.toLowerCase();
      const inputPhone = phone?.replace(/\D/g, '');
      const inputEmail = email?.toLowerCase();

      if (
        (inputPhone && csvPhone && csvPhone === inputPhone) ||
        (inputEmail && csvEmail && csvEmail === inputEmail)
      ) {
        console.log("✅ Match found:", data);
        results.push(data);
      }
    })
    .on("end", () => {
      if (results.length > 0) {
        res.json({ match: true, data: results[0] });
      } else {
        console.log("❌ No match found for:", email || phone);
        res.json({ match: false });
      }
    })
    .on("error", (err) => {
      console.error("❌ CSV Read Error:", err);
      res.status(500).json({ error: "Error reading client records." });
    });
});

// 🔁 OpenAI chat route
app.post("/chat", async (req, res) => {
  try {
    const { userMessage } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
            `,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    if (data?.choices?.[0]?.message?.content) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      console.error("OpenAI response issue:", data);
      res.status(500).json({ error: "Invalid response from OpenAI" });
    }
  } catch (error) {
    console.error("OpenAI fetch error:", error);
    res.status(500).json({ error: "Error contacting OpenAI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
