import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { GoogleGenAI } from "@google/genai";
import { evaluate } from "mathjs";
import { getAudioUrl } from "google-tts-api";

// ==========================================
// 1. CONFIGURATION
// ==========================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PORT = Number(process.env.PORT || 3000);
const ENABLE_GOOGLE_SEARCH =
  process.env.ENABLE_GOOGLE_SEARCH === "true";

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN is missing.");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// ==========================================
// 2. SERVER / HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bangla Smart Tools</title>
        <style>
          body {
            background:#101d32;
            color:white;
            font-family:Arial,sans-serif;
            text-align:center;
            padding:50px 15px;
          }
          .card {
            max-width:420px;
            margin:auto;
            padding:30px;
            border-radius:20px;
            background:#1b3150;
          }
          .status {color:#54e49b;font-weight:bold}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🤖 Bangla Smart Tools</h1>
          <h3 class="status">● Server Online</h3>
          <p>Professional AI Telegram Assistant</p>
          <p>Version 7.0.0</p>
        </div>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Bangla Smart Tools",
    version: "7.0.0",
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// ==========================================
// 3. LANGUAGE DATABASE
// ==========================================

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧", tts: "en" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", tts: "ar" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", tts: "hi" },
  { code: "ur", name: "Urdu", flag: "🇵🇰", tts: "ur" },
  { code: "fr", name: "French", flag: "🇫🇷", tts: "fr" },
  { code: "de", name: "German", flag: "🇩🇪", tts: "de" },
  { code: "es", name: "Spanish", flag: "🇪🇸", tts: "es" },
  { code: "it", name: "Italian", flag: "🇮🇹", tts: "it" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", tts: "pt" },
  { code: "ru", name: "Russian", flag: "🇷🇺", tts: "ru" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", tts: "zh-CN" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", tts: "ja" },
  { code: "ko", name: "Korean", flag: "🇰🇷", tts: "ko" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", tts: "tr" },
  { code: "id", name: "Indonesian", flag: "🇮🇩", tts: "id" },
  { code: "ms", name: "Malay", flag: "🇲🇾", tts: "ms" },
  { code: "th", name: "Thai", flag: "🇹🇭", tts: "th" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", tts: "vi" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", tts: "nl" },
  { code: "pl", name: "Polish", flag: "🇵🇱", tts: "pl" },
  { code: "uk", name: "Ukrainian", flag: "🇺🇦", tts: "uk" },
  { code: "fa", name: "Persian", flag: "🇮🇷", tts: "fa" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", tts: "he" },
  { code: "el", name: "Greek", flag: "🇬🇷", tts: "el" },
  { code: "sv", name: "Swedish", flag: "🇸🇪", tts: "sv" },
  { code: "da", name: "Danish", flag: "🇩🇰", tts: "da" },
  { code: "no", name: "Norwegian", flag: "🇳🇴", tts: "no" },
  { code: "fi", name: "Finnish", flag: "🇫🇮", tts: "fi" },
  { code: "ro", name: "Romanian", flag: "🇷🇴", tts: "ro" },
  { code: "cs", name: "Czech", flag: "🇨🇿", tts: "cs" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺", tts: "hu" },
  { code: "bn", name: "Bengali", flag: "🇧🇩", tts: "bn" },
  { code: "ne", name: "Nepali", flag: "🇳🇵", tts: "ne" },
  { code: "ta", name: "Tamil", flag: "🇮🇳", tts: "ta" },
  { code: "te", name: "Telugu", flag: "🇮🇳", tts: "te" },
  { code: "mr", name: "Marathi", flag: "🇮🇳", tts: "mr" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", tts: "sw" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦", tts: "af" }
];

// ==========================================
// 4. MAIN MENU
// ==========================================

const MAIN_MENU = {
  keyboard: [
    [{ text: "🤖 AI Assistant" }, { text: "🌍 ভাষা অনুবাদ" }],
    [{ text: "🎓 ভাষা শিখুন" }, { text: "🎙️ ভয়েস ইনপুট" }],
    [{ text: "🔊 শেষ উত্তর শুনুন" }, { text: "🧮 ক্যালকুলেটর" }],
    [{ text: "✍️ AI কনটেন্ট" }, { text: "🎬 ভিডিও কনটেন্ট" }],
    [{ text: "📝 সোশ্যাল ক্যাপশন" }, { text: "🔢 নাম্বার কনভার্টার" }],
    [{ text: "📚 গণিতের সূত্র" }, { text: "🖼️ ছবি থেকে লেখা" }],
    [{ text: "📄 PDF Assistant" }, { text: "🔎 লাইভ তথ্য" }],
    [{ text: "ℹ️ About" }, { text: "❓ Help" }],
    [{ text: "🏠 Home" }, { text: "🔄 Reset Chat" }]
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "এখানে লিখুন অথবা ভয়েস পাঠান..."
};

const HOME_TEXT = `
🌟 স্বাগতম Bangla Smart Tools-এ!

আপনার ব্যক্তিগত AI সহকারী।

🤖 AI Chat
🌍 Smart Translator
🎓 Language Learning
🎙️ Voice Assistant
🧮 Advanced Calculator
✍️ AI Content Studio
🎬 Video Studio
🖼️ Image to Text
📄 PDF Assistant
🔎 Live Information

নিচের মেনু থেকে একটি সেবা নির্বাচন করুন।
`;

// ==========================================
// 5. SESSION AND RATE LIMIT
// ==========================================

const sessions = new Map();
const userLimits = new Map();
const lastAnswers = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      mode: "chat",
      history: [],
      targetLanguage: null,
      sourceLanguage: null,
      lastActivity: Date.now()
    });
  }

  const session = sessions.get(userId);
  session.lastActivity = Date.now();
  return session;
}

function checkRateLimit(userId) {
  const now = Date.now();
  const previous = userLimits.get(userId) || [];

  const recent = previous.filter(
    time => now - time < 60000
  );

  if (recent.length >= 12) {
    return false;
  }

  recent.push(now);
  userLimits.set(userId, recent);
  return true;
}

// Clean inactive sessions every 30 minutes.
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  for (const [id, session] of sessions.entries()) {
    if (session.lastActivity < cutoff) {
      sessions.delete(id);
      lastAnswers.delete(id);
      userLimits.delete(id);
    }
  }
}, 30 * 60 * 1000).unref();

// ==========================================
// 6. COMMON HELPERS
// ==========================================

async function sendText(chatId, text, extra = {}) {
  const safeText = String(text || "কোনো উত্তর পাওয়া যায়নি।");

  const chunks = [];
  for (let i = 0; i < safeText.length; i += 3800) {
    chunks.push(safeText.slice(i, i + 3800));
  }

  for (let i = 0; i < chunks.length; i++) {
    await bot.sendMessage(chatId, chunks[i], {
      ...extra,
      reply_markup:
        i === chunks.length - 1
          ? (extra.reply_markup || MAIN_MENU)
          : undefined
    });
  }
}

async function typing(chatId) {
  try {
    await bot.sendChatAction(chatId, "typing");
  } catch {}
}

function getLanguage(code) {
  return LANGUAGES.find(item => item.code === code);
}

function languageKeyboard(page = 0) {
  const perPage = 10;
  const start = page * perPage;
  const selected = LANGUAGES.slice(start, start + perPage);

  const rows = [];

  for (let i = 0; i < selected.length; i += 2) {
    rows.push(
      selected.slice(i, i + 2).map(lang => ({
        text: `${lang.flag} ${lang.name}`,
        callback_data: `lang_${lang.code}`
      }))
    );
  }

  const navigation = [];

  if (page > 0) {
    navigation.push({
      text: "⬅️ আগের",
      callback_data: `langpage_${page - 1}`
    });
  }

  if (start + perPage < LANGUAGES.length) {
    navigation.push({
      text: "পরের ➡️",
      callback_data: `langpage_${page + 1}`
    });
  }

  if (navigation.length) rows.push(navigation);

  rows.push([
    { text: "🇧🇩 বাংলায় অনুবাদ", callback_data: "lang_bn" }
  ]);

  return { inline_keyboard: rows };
}

// ==========================================
// 7. GEMINI AI ENGINE
// ==========================================

const SYSTEM_INSTRUCTION = `
তুমি Bangla Smart Tools-এর একজন উন্নত, সহায়ক AI Assistant।

নিয়ম:
- ব্যবহারকারী বাংলায় লিখলে বাংলায় উত্তর দাও।
- ব্যবহারকারীর ভাষা বুঝে উত্তর দাও।
- সহজ, নির্ভুল ও পরিষ্কার ভাষা ব্যবহার করো।
- প্রয়োজন হলে উদাহরণ দাও।
- গণিতে ধাপে ধাপে ব্যাখ্যা করো।
- অনুবাদে মূল অর্থ ও স্বাভাবিক ভাষা বজায় রাখো।
- বানানো তথ্যকে সত্য বলে উপস্থাপন করবে না।
- লাইভ তথ্য না পেলে সেটি স্পষ্ট করে বলবে।
- ব্যবহারকারীর ব্যক্তিগত তথ্য অপ্রয়োজনে চাইবে না।
- কোনো API key, password বা secret চাইবে না।
`;

async function askAI(userId, prompt, options = {}) {
  const session = getSession(userId);

  const history = session.history.slice(-10);

  const contents = [
    ...history,
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: options.temperature ?? 0.5
  };

  if (options.liveSearch && ENABLE_GOOGLE_SEARCH) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config
  });

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error("AI থেকে খালি উত্তর এসেছে।");
  }

  session.history.push(
    { role: "user", parts: [{ text: prompt }] },
    { role: "model", parts: [{ text: answer }] }
  );

  session.history = session.history.slice(-20);

  lastAnswers.set(userId, answer);

  return answer;
}

// ==========================================
// 8. TEXT TO SPEECH
// ==========================================

function splitForSpeech(text, maxLength = 180) {
  const words = String(text).split(/\s+/);
  const chunks = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxLength && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function detectTTSLanguage(text) {
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-CN";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  return "en";
}

async function speakText(chatId, text, language = null) {
  const lang = language || detectTTSLanguage(text);
  const chunks = splitForSpeech(text, 180).slice(0, 8);

  await bot.sendMessage(
    chatId,
    "🔊 অডিও তৈরি হচ্ছে...",
    { reply_markup: MAIN_MENU }
  );

  for (const chunk of chunks) {
    try {
      const audioUrl = getAudioUrl(chunk, {
        lang,
        slow: false,
        host: "https://translate.google.com"
      });

      await bot.sendAudio(chatId, audioUrl, {
        title: "Bangla Smart Tools Voice",
        performer: "AI Assistant"
      });
    } catch (error) {
      console.error("TTS error:", error.message);
      await bot.sendMessage(
        chatId,
        "এই অংশের অডিও তৈরি করা যায়নি। লেখাটি আবার চেষ্টা করুন।"
      );
      break;
    }
  }
}

// ==========================================
// 9. TRANSLATION
// ==========================================

async function translateText(userId, text, targetCode) {
  const target = getLanguage(targetCode);

  if (!target) {
    throw new Error("ভাষাটি পাওয়া যায়নি।");
  }

  const prompt = `
নিচের লেখাটি স্বাভাবিক, নির্ভুল ও অর্থ অক্ষুণ্ণ রেখে
${target.name} ভাষায় অনুবাদ করো।

নিয়ম:
- শুধু অনুবাদ দেবে।
- মূল লেখার অর্থ পরিবর্তন করবে না।
- নাম, সংখ্যা ও প্রয়োজনীয় চিহ্ন ঠিক রাখবে।
- অপ্রয়োজনীয় ব্যাখ্যা দেবে না।

লেখা:
${text}
`;

  return askAI(userId, prompt, { temperature: 0.2 });
}

// ==========================================
// 10. CALCULATOR
// ==========================================

function calculate(expression) {
  const input = String(expression).trim();

  if (!input || input.length > 200) {
    throw new Error("হিসাবটি সঠিকভাবে লিখুন।");
  }

  if (!/^[0-9+\-*/().,%^\sA-Za-z]+$/.test(input)) {
    throw new Error("এই ধরনের ইনপুট অনুমোদিত নয়।");
  }

  const forbidden = [
    "import", "createUnit", "evaluate",
    "parse", "simplify", "derivative",
    "resolve", "help", "function",
    "expression", "compile"
  ];

  const lower = input.toLowerCase();

  if (
    forbidden.some(word => lower.includes(word)) ||
    /[=;{}\[\]]/.test(input)
  ) {
    throw new Error("নিরাপত্তার কারণে এই এক্সপ্রেশন গ্রহণ করা হয়নি।");
  }

  const result = evaluate(input, {
    pi: Math.PI,
    e: Math.E
  });

  if (
    typeof result !== "number" ||
    !Number.isFinite(result)
  ) {
    throw new Error("এই হিসাবের উত্তর পাওয়া যায়নি।");
  }

  return result;
}

async function explainCalculation(userId, expression, result) {
  return askAI(
    userId,
    `এই গণিতটি ধাপে ধাপে বাংলায় ব্যাখ্যা করো।
     হিসাব: ${expression}
     সঠিক ফলাফল: ${result}
     ফলাফল পরিবর্তন করবে না।`,
    { temperature: 0.2 }
  );
}

// ==========================================
// 11. NUMBER CONVERTER
// ==========================================

function numberToBangla(number) {
  const digits = "০১২৩৪৫৬৭৮৯";

  return String(number).replace(/[0-9]/g, digit =>
    digits[Number(digit)]
  );
}

function numberToWords(num) {
  const n = Number(num);

  if (!Number.isInteger(n) || n < 0 || n > 999999999) {
    return "০ থেকে ৯৯৯৯৯৯৯৯৯ পর্যন্ত পূর্ণসংখ্যা দিন।";
  }

  if (n === 0) return "শূন্য";

  const ones = [
    "", "এক", "দুই", "তিন", "চার", "পাঁচ",
    "ছয়", "সাত", "আট", "নয়", "দশ",
    "এগারো", "বারো", "তেরো", "চৌদ্দ",
    "পনেরো", "ষোলো", "সতেরো", "আঠারো",
    "উনিশ"
  ];

  const tens = [
    "", "", "বিশ", "ত্রিশ", "চল্লিশ",
    "পঞ্চাশ", "ষাট", "সত্তর", "আশি", "নব্বই"
  ];

  function twoDigit(x) {
    if (x < 20) return ones[x];
    const t = Math.floor(x / 10);
    const r = x % 10;
    return tens[t] + (r ? " " + ones[r] : "");
  }

  function convert(x) {
    if (x < 100) return twoDigit(x);

    if (x < 1000) {
      const h = Math.floor(x / 100);
      const r = x % 100;
      return ones[h] + "শ" + (r ? " " + convert(r) : "");
    }

    if (x < 100000) {
      const h = Math.floor(x / 1000);
      const r = x % 1000;
      return convert(h) + " হাজার" + (r ? " " + convert(r) : "");
    }

    if (x < 10000000) {
      const h = Math.floor(x / 100000);
      const r = x % 100000;
      return convert(h) + " লক্ষ" + (r ? " " + convert(r) : "");
    }

    const h = Math.floor(x / 10000000);
    const r = x % 10000000;

    return convert(h) + " কোটি" + (r ? " " + convert(r) : "");
  }

  return convert(n);
}

// ==========================================
// 12. MAIN MENU HANDLERS
// ==========================================

async function showHome(chatId) {
  await bot.sendMessage(chatId, HOME_TEXT, {
    reply_markup: MAIN_MENU
  });
}

async function showLanguageMenu(chatId) {
  await bot.sendMessage(
    chatId,
    "🌍 কোন ভাষায় অনুবাদ করতে চান?\n\nবাংলা থেকে নির্বাচিত ভাষায় এবং অন্য ভাষা থেকে বাংলায় অনুবাদ করা যাবে।",
    {
      reply_markup: languageKeyboard(0)
    }
  );
}

async function showHelp(chatId) {
  await sendText(chatId, `
❓ Bangla Smart Tools Help

🤖 AI Assistant:
যেকোনো প্রশ্ন লিখুন।

🌍 ভাষা অনুবাদ:
ভাষা নির্বাচন করুন, তারপর লেখা পাঠান।

🎓 ভাষা শিখুন:
যে ভাষা শিখতে চান তার নাম লিখুন।

🎙️ ভয়েস ইনপুট:
Telegram-এর মাইক্রোফোন দিয়ে Voice Message পাঠান।

🔊 শেষ উত্তর শুনুন:
AI-এর সর্বশেষ উত্তর অডিওতে শুনুন।

🧮 Calculator:
যেমন: ২৫+৫০ অথবা 25*5

✍️ AI Content:
পোস্টের বিষয় লিখুন।

🎬 Video:
ভিডিওর বিষয় লিখুন।

🖼️ Image to Text:
ছবি পাঠান।

📄 PDF Assistant:
PDF ফাইল পাঠান।

🏠 Home:
মূল মেনুতে ফিরুন।
`);
}

// ==========================================
// 13. MENU ROUTER
// ==========================================

async function handleMenu(chatId, userId, text) {
  const session = getSession(userId);

  switch (text) {
    case "🏠 Home":
      session.mode = "chat";
      return showHome(chatId);

    case "🤖 AI Assistant":
      session.mode = "chat";
      return sendText(
        chatId,
        "🤖 AI Assistant চালু হয়েছে।\nআপনার প্রশ্ন লিখুন।"
      );

    case "🌍 ভাষা অনুবাদ":
      session.mode = "translate";
      session.targetLanguage = null;
      return showLanguageMenu(chatId);

    case "🎓 ভাষা শিখুন":
      session.mode = "learn";
      return sendText(
        chatId,
        "🎓 কোন ভাষা শিখতে চান?\nযেমন: English, Arabic, Hindi, French লিখুন।"
      );

    case "🎙️ ভয়েস ইনপুট":
      session.mode = "voice";
      return sendText(
        chatId,
        "🎙️ এখন Telegram-এর মাইক্রোফোন দিয়ে Voice Message পাঠান।\nআমি সেটিকে লেখায় রূপান্তর করার চেষ্টা করব।"
      );

    case "🔊 শেষ উত্তর শুনুন": {
      const answer = lastAnswers.get(userId);

      if (!answer) {
        return sendText(chatId, "এখনো শোনার মতো কোনো উত্তর নেই।");
      }

      return speakText(chatId, answer);
    }

    case "🧮 ক্যালকুলেটর":
      session.mode = "calculator";
      return sendText(
        chatId,
        "🧮 Advanced Calculator\n\nআপনার হিসাব লিখুন।\nউদাহরণ: (25+15)*2\n\nসমাধানের সঙ্গে ব্যাখ্যাও পাবেন।"
      );

    case "✍️ AI কনটেন্ট":
      session.mode = "content";
      return sendText(
        chatId,
        "✍️ কী বিষয়ে পোস্ট লিখতে চান?\nপ্ল্যাটফর্ম ও বিষয় লিখুন।"
      );

    case "🎬 ভিডিও কনটেন্ট":
      session.mode = "video";
      return sendText(
        chatId,
        "🎬 ভিডিওর বিষয় লিখুন।\nআমি স্ক্রিপ্ট, দৃশ্য ও ভয়েসওভার আইডিয়া তৈরি করব।"
      );

    case "📝 সোশ্যাল ক্যাপশন":
      session.mode = "caption";
      return sendText(
        chatId,
        "📝 ছবির বা ভিডিওর বিষয় লিখুন।\nআমি ক্যাপশন ও হ্যাশট্যাগ তৈরি করব।"
      );

    case "🔢 নাম্বার কনভার্টার":
      session.mode = "number";
      return sendText(
        chatId,
        "🔢 একটি সংখ্যা লিখুন।\nআমি সেটিকে বাংলা কথায় লিখে দেব।"
      );

    case "📚 গণিতের সূত্র":
      session.mode = "formulas";
      return sendText(
        chatId,
        "📚 কোন গণিতের সূত্র জানতে চান?\nযেমন: বীজগণিত, জ্যামিতি, ত্রিকোণমিতি, শতকরা।"
      );

    case "🖼️ ছবি থেকে লেখা":
      session.mode = "image";
      return sendText(
        chatId,
        "🖼️ একটি ছবি পাঠান।\nছবির মধ্যে থাকা লেখা শনাক্ত করার চেষ্টা করব।"
      );

    case "📄 PDF Assistant":
      session.mode = "pdf";
      return sendText(
        chatId,
        "📄 একটি PDF ফাইল পাঠান।\nআমি এর বিষয়বস্তু বুঝে সারাংশ বা প্রশ্নের উত্তর দিতে পারব।"
      );

    case "🔎 লাইভ তথ্য":
      session.mode = "live";
      return sendText(
        chatId,
        ENABLE_GOOGLE_SEARCH
          ? "🔎 লাইভ তথ্য মোড চালু হয়েছে।\nআপনার প্রশ্ন লিখুন।"
          : "লাইভ সার্চ চালু করতে Render-এ ENABLE_GOOGLE_SEARCH=true সেট করতে হবে।"
      );

    case "ℹ️ About":
      return sendText(chatId, `
🌟 Bangla Smart Tools

একটি AI-powered Telegram Assistant।

সুবিধা:
• AI Chat
• Smart Translation
• Language Learning
• Voice Input & Output
• Advanced Calculator
• Content & Video Studio
• Image Text Recognition
• PDF Assistant

Version: 7.0.0
`);

    case "❓ Help":
      return showHelp(chatId);

    case "🔄 Reset Chat":
      session.history = [];
      session.mode = "chat";
      session.targetLanguage = null;
      lastAnswers.delete(userId);

      return sendText(
        chatId,
        "🔄 নতুন চ্যাট শুরু হয়েছে। আগের কথোপকথনের প্রসঙ্গ এই সেশনে আর ব্যবহার হবে না।"
      );

    default:
      return null;
  }
}

// ==========================================
// 14. TRANSLATION CALLBACKS
// ==========================================

bot.on("callback_query", async query => {
  try {
    const userId = String(query.from.id);
    const chatId = query.message.chat.id;
    const data = query.data || "";

    await bot.answerCallbackQuery(query.id);

    if (data.startsWith("langpage_")) {
      const page = Number(data.split("_")[1]) || 0;

      return bot.editMessageReplyMarkup(
        languageKeyboard(page),
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
    }

    if (data.startsWith("lang_")) {
      const code = data.replace("lang_", "");
      const language = getLanguage(code);

      if (!language) return;

      const session = getSession(userId);
      session.mode = "translate";
      session.targetLanguage = code;

      return sendText(
        chatId,
        `${language.flag} ${language.name} নির্বাচন করা হয়েছে।\n\nএখন যে লেখাটি অনুবাদ করতে চান সেটি পাঠান।`
      );
    }

    if (data === "speak_last") {
      const answer = lastAnswers.get(userId);

      if (!answer) {
        return sendText(chatId, "শোনার মতো কোনো উত্তর নেই।");
      }

      return speakText(chatId, answer);
    }

  } catch (error) {
    console.error("Callback error:", error.message);
  }
});

// ==========================================
// 15. VOICE MESSAGE TO TEXT
// ==========================================

async function transcribeVoice(chatId, userId, voice) {
  await typing(chatId);

  const fileUrl = await bot.getFileLink(voice.file_id);
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error("ভয়েস ফাইল ডাউনলোড করা যায়নি।");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > 18 * 1024 * 1024) {
    throw new Error("ভয়েস ফাইলটি অনেক বড়। ছোট ভয়েস পাঠান।");
  }

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "audio/ogg"
        }
      },
      "এই অডিওতে যা বলা হয়েছে তা হুবহু লেখায় রূপান্তর করো। যে ভাষায় বলা হয়েছে সেই ভাষাতেই লিখবে। শুধু ট্রান্সক্রিপশন দাও।"
    ]
  });

  const transcript = result.text?.trim();

  if (!transcript) {
    throw new Error("অডিও থেকে লেখা পাওয়া যায়নি।");
  }

  await sendText(
    chatId,
    `🎙️ আপনার কথার লেখা:\n\n${transcript}\n\nএখন চাইলে AI-কে প্রশ্ন করতে পারেন।`
  );

  const session = getSession(userId);
  session.mode = "chat";
  session.history.push({
    role: "user",
    parts: [{ text: transcript }]
  });
}

// ==========================================
// 16. IMAGE OCR
// ==========================================

async function readImage(chatId, userId, photo) {
  await typing(chatId);

  const fileUrl = await bot.getFileLink(photo.file_id);
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error("ছবি ডাউনলোড করা যায়নি।");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > 18 * 1024 * 1024) {
    throw new Error("ছবিটি অনেক বড়। ছোট ছবি পাঠান।");
  }

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "image/jpeg"
        }
      },
      "ছবির মধ্যে থাকা লেখা শনাক্ত করে পরিষ্কারভাবে লিখে দাও। লেখা না থাকলে ছবির সংক্ষিপ্ত বিবরণ দাও।"
    ]
  });

  const answer = result.text?.trim() || "ছবিটি পড়া যায়নি।";

  lastAnswers.set(userId, answer);
  await sendText(chatId, `🖼️ ছবির ফলাফল:\n\n${answer}`);
}

// ==========================================
// 17. PDF ASSISTANT
// ==========================================

async function readPDF(chatId, userId, document) {
  if (document.mime_type !== "application/pdf") {
    return sendText(chatId, "শুধু PDF ফাইল পাঠান।");
  }

  if (document.file_size > 18 * 1024 * 1024) {
    return sendText(chatId, "PDF ফাইলটি অনেক বড়। ১৮ MB-এর কম ফাইল পাঠান।");
  }

  await typing(chatId);

  const fileUrl = await bot.getFileLink(document.file_id);
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error("PDF ডাউনলোড করা যায়নি।");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf"
        }
      },
      "এই PDF-এর বিষয়বস্তু বাংলায় সংক্ষেপে বুঝিয়ে দাও। গুরুত্বপূর্ণ তথ্য, শিরোনাম ও মূল পয়েন্টগুলো সাজিয়ে দাও।"
    ]
  });

  const answer = result.text?.trim() || "PDF বিশ্লেষণ করা যায়নি।";

  lastAnswers.set(userId, answer);
  await sendText(chatId, `📄 PDF সারাংশ:\n\n${answer}`);
}

// ==========================================
// 18. TEXT MESSAGE ROUTER
// ==========================================

async function processText(chatId, userId, text) {
  const session = getSession(userId);
  const mode = session.mode;

  if (mode === "translate") {
    if (!session.targetLanguage) {
      return showLanguageMenu(chatId);
    }

    await typing(chatId);

    const answer = await translateText(
      userId,
      text,
      session.targetLanguage
    );

    const language = getLanguage(session.targetLanguage);

    lastAnswers.set(userId, answer);

    return sendText(
      chatId,
      `${language.flag} ${language.name} অনুবাদ:\n\n${answer}`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: "🔊 শুনুন", callback_data: "speak_last" },
            { text: "🌍 ভাষা বদলান", callback_data: "lang_bn" }
          ]]
        }
      }
    );
  }

  if (mode === "calculator") {
    const result = calculate(text);

    const explanation = await explainCalculation(
      userId,
      text,
      result
    );

    return sendText(
      chatId,
      `🧮 হিসাব:\n${text}\n\n✅ ফলাফল: ${result}\n\n${explanation}`
    );
  }

  if (mode === "number") {
    const normalized = text.replace(/[০-৯]/g, d =>
      String("০১২৩৪৫৬৭৮৯".indexOf(d))
    );

    const value = Number(normalized);

    if (!Number.isInteger(value) || value < 0) {
      return sendText(chatId, "দয়া করে একটি ধনাত্মক পূর্ণসংখ্যা দিন।");
    }

    return sendText(
      chatId,
      `🔢 সংখ্যা: ${numberToBangla(value)}\n\nবাংলা কথায়: ${numberToWords(value)}`
    );
  }

  if (mode === "learn") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `আমি ${text} ভাষা শিখতে চাই। একজন শিক্ষক হিসেবে আমাকে ৫টি দরকারি শব্দ শেখাও। প্রতিটির মূল ভাষার শব্দ, বাংলা অর্থ, বাংলা উচ্চারণ এবং একটি সহজ বাক্য দাও। শেষে ছোট কুইজ দাও।`
    );

    return sendText(chatId, answer);
  }

  if (mode === "content") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `এই বিষয় নিয়ে একটি মানসম্মত সোশ্যাল মিডিয়া পোস্ট তৈরি করো: ${text}। আকর্ষণীয় শিরোনাম, পোস্ট, ক্যাপশন ও প্রাসঙ্গিক হ্যাশট্যাগ দাও।`
    );

    return sendText(chatId, answer);
  }

  if (mode === "video") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `এই বিষয় নিয়ে একটি ভিডিও তৈরির পরিকল্পনা করো: ${text}। ভিডিওর শিরোনাম, হুক, দৃশ্যভিত্তিক স্ক্রিপ্ট, ভয়েসওভার ও শেষের আহ্বান দাও।`
    );

    return sendText(chatId, answer);
  }

  if (mode === "caption") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `এই বিষয় বা ছবির জন্য ৩টি আলাদা সোশ্যাল মিডিয়া ক্যাপশন এবং প্রাসঙ্গিক হ্যাশট্যাগ তৈরি করো: ${text}`
    );

    return sendText(chatId, answer);
  }

  if (mode === "formulas") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `বাংলায় ${text} বিষয়ে প্রয়োজনীয় গণিতের সূত্র, প্রতীকগুলোর অর্থ এবং সহজ উদাহরণ দাও।`
    );

    return sendText(chatId, answer);
  }

  if (mode === "live") {
    await typing(chatId);

    if (!ENABLE_GOOGLE_SEARCH) {
      return sendText(chatId, "লাইভ সার্চ বর্তমানে চালু নেই।");
    }

    const answer = await askAI(
      userId,
      `এই প্রশ্নের উত্তর দিতে Google Search ব্যবহার করে পাওয়া সাম্প্রতিক তথ্য ও তারিখ উল্লেখ করো। তথ্য না পেলে অনুমান করবে না। প্রশ্ন: ${text}`,
      { liveSearch: true }
    );

    return sendText(chatId, answer);
  }

  // Default: AI Chat
  await typing(chatId);

  const answer = await askAI(userId, text);

  return sendText(
    chatId,
    answer,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: "🔊 উত্তর শুনুন", callback_data: "speak_last" },
          { text: "💬 নতুন চ্যাট", callback_data: "new_chat" }
        ]]
      }
    }
  );
}

// ==========================================
// 19. NEW CHAT CALLBACK
// ==========================================

bot.on("callback_query", async query => {
  if (query.data !== "new_chat") return;

  try {
    const userId = String(query.from.id);
    const session = getSession(userId);

    session.history = [];
    session.mode = "chat";

    await bot.answerCallbackQuery(query.id, {
      text: "নতুন চ্যাট শুরু হয়েছে।"
    });

    await sendText(
      query.message.chat.id,
      "💬 নতুন AI চ্যাট শুরু হয়েছে। আপনার প্রশ্ন লিখুন।"
    );
  } catch (error) {
    console.error("New chat error:", error.message);
  }
});

// ==========================================
// 20. MAIN TELEGRAM MESSAGE HANDLER
// ==========================================

bot.on("message", async message => {
  const chatId = message.chat.id;
  const userId = String(message.from?.id || "");

  if (!userId) return;

  try {
    // Ignore unsupported chat types.
    if (message.chat.type !== "private") return;

    // Voice input
    if (message.voice) {
      if (!checkRateLimit(userId)) {
        return sendText(chatId, "একটু অপেক্ষা করে আবার চেষ্টা করুন।");
      }

      return await transcribeVoice(
        chatId,
        userId,
        message.voice
      );
    }

    // Photo OCR
    if (message.photo?.length) {
      const session = getSession(userId);

      if (session.mode !== "image") {
        return sendText(
          chatId,
          "ছবি থেকে লেখা পড়তে প্রথমে 🖼️ ছবি থেকে লেখা নির্বাচন করুন।"
        );
      }

      if (!checkRateLimit(userId)) {
        return sendText(chatId, "একটু অপেক্ষা করে আবার চেষ্টা করুন।");
      }

      const photo = message.photo[message.photo.length - 1];

      return await readImage(chatId, userId, photo);
    }

    // PDF
    if (message.document) {
      const session = getSession(userId);

      if (session.mode !== "pdf") {
        return sendText(
          chatId,
          "PDF Assistant নির্বাচন করে তারপর PDF পাঠান।"
        );
      }

      if (!checkRateLimit(userId)) {
        return sendText(chatId, "একটু অপেক্ষা করে আবার চেষ্টা করুন।");
      }

      return await readPDF(
        chatId,
        userId,
        message.document
      );
    }

    if (!message.text) return;

    const text = message.text.trim();

    if (!text) return;

    // Commands
    if (text === "/start") {
      const session = getSession(userId);
      session.mode = "chat";
      session.history = [];

      return showHome(chatId);
    }

    if (text === "/menu") {
      return showHome(chatId);
    }

    if (text === "/help") {
      return showHelp(chatId);
    }

    if (text === "/reset") {
      const session = getSession(userId);
      session.history = [];
      session.mode = "chat";
      lastAnswers.delete(userId);

      return sendText(chatId, "নতুন চ্যাট শুরু হয়েছে।");
    }

    // Main menu
    const menuResult = await handleMenu(
      chatId,
      userId,
      text
    );

    if (menuResult !== null) return;

    // Rate limit
    if (!checkRateLimit(userId)) {
      return sendText(
        chatId,
        "⚡ আপনি দ্রুত অনেকগুলো অনুরোধ পাঠিয়েছেন। এক মিনিট পরে আবার চেষ্টা করুন।"
      );
    }

    // Text processing
    await processText(chatId, userId, text);

  } catch (error) {
    console.error("Message error:", error);

    let messageText =
      "দুঃখিত, অনুরোধটি সম্পন্ন করা যায়নি। একটু পরে আবার চেষ্টা করুন।";

    if (
      error.message?.includes("429") ||
      error.message?.toLowerCase().includes("quota")
    ) {
      messageText =
        "⚠️ AI সার্ভারের ব্যবহারসীমা সাময়িকভাবে পূর্ণ হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।";
    } else if (
      error.message?.includes("API key") ||
      error.message?.includes("401") ||
      error.message?.includes("403")
    ) {
      messageText =
        "⚠️ AI API সেটিংসে সমস্যা আছে। সার্ভার অ্যাডমিনকে জানাতে হবে।";
    } else if (error.message?.length < 250) {
      messageText = `⚠️ ${error.message}`;
    }

    try {
      await sendText(chatId, messageText);
    } catch (sendError) {
      console.error("Error reply failed:", sendError.message);
    }
  }
});

// ==========================================
// 21. BOT ERROR HANDLING
// ==========================================

bot.on("polling_error", error => {
  console.error("Telegram polling error:", error.message);
});

bot.on("webhook_error", error => {
  console.error("Telegram webhook error:", error.message);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error);
});

console.log("=================================");
console.log("Bangla Smart Tools v7.0.0");
console.log("AI Model:", MODEL);
console.log("Google Search:", ENABLE_GOOGLE_SEARCH);
console.log("Telegram Bot: Starting...");
console.log("=================================");
