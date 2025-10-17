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

// 🔁 OpenAI chat route (now form-aware)
app.post("/chat", async (req, res) => {
  try {
    const { userMessage } = req.body;
    const lowerMsg = userMessage.toLowerCase();

    // --- Local form library (same structure as client side) ---
    const formLibrary = {
      "mvt-5-13": {
        label: "MVT-5-13 Form (Alabama)",
        path: "https://eforms.com/download/2015/09/Alabama-Motor-Vehicle-Power-of-Attorney-Form-MVT-5-13.pdf",
      },
      "mvt-41-1": {
        label: "MVT-41-1 Form (Alabama)",
        path: "https://drive.google.com/file/d/1J3jB9wuNE0l4zqxgvIumvRehJmtwF7g8/view",
      },
      "mvt-12-1": {
        label: "MVT-12-1 Form (Alabama)",
        path: "https://www.formalu.com/forms/506/application-for-replacement-title",
      },
      "mvt-5-7": {
        label: "MVT-5-7 Form (Alabama)",
        path: "https://www.revenue.alabama.gov/wp-content/uploads/2021/10/MVT-5-7-8-19.pdf",
      },
      "mvt-5-6": {
        label: "MVT-5-6 Form (Alabama)",
        path: "https://drive.google.com/file/d/1oWm0T7w9C0UsaNcw5S0nt5pYWzmRBTrW/view",
      },
    };

    // --- Normalize helper to catch variants like "MVT 513" ---
    function normalizeForMatch(s) {
      return s
        .toLowerCase()
        .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D\u2043\u002D]/g, "-")
        .replace(/[\s_]+/g, "-")
        .trim();
    }

    // --- Try to match known form codes or keywords ---
    let matchedForm = null;

    for (const [code, meta] of Object.entries(formLibrary)) {
      const normCode = normalizeForMatch(code);
      if (
        lowerMsg.includes(normCode) ||
        lowerMsg.includes(meta.label.toLowerCase()) ||
        lowerMsg.includes(meta.label.toLowerCase().split("(")[0].trim())
      ) {
        matchedForm = { code, meta };
        break;
      }
    }

    // --- Keyword fallback for users who type “power of attorney form” etc. ---
    if (!matchedForm) {
      const keywordMap = [
        { keyword: "power of attorney", code: "mvt-5-13" },
        { keyword: "salvage", code: "mvt-41-1" },
        { keyword: "duplicate", code: "mvt-12-1" },
        { keyword: "replacement title", code: "mvt-12-1" },
        { keyword: "vin inspection", code: "mvt-5-7" },
      ];
      const found = keywordMap.find(k => lowerMsg.includes(k.keyword));
      if (found) matchedForm = { code: found.code, meta: formLibrary[found.code] };
    }

    // --- If a match is found, respond immediately (skip OpenAI) ---
    if (matchedForm) {
      const { label, path } = matchedForm.meta;
      return res.json({
        reply: `📄 You can access the <strong>${label}</strong> here:<br><br><a href="${path}" target="_blank" style="color:#3b82f6;text-decoration:underline;">Open Form</a>`,
      });
    }

    // --- Otherwise, call OpenAI normally ---
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
    const aiReply = data?.choices?.[0]?.message?.content || "Sorry, I couldn’t get a response.";

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("❌ OpenAI fetch error:", error);
    res.status(500).json({ error: "Error contacting OpenAI" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
