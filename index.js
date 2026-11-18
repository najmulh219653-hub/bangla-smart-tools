import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { GoogleGenAI } from "@google/genai";
import { parse } from "mathjs";
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

if (!BOT_TOKEN || !GEMINI_API_KEY) {
  console.error("BOT_TOKEN অথবা GEMINI_API_KEY পাওয়া যায়নি।");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// ==========================================
// 2. PROFESSIONAL WEB STATUS
// ==========================================

app.get("/", (req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bangla Smart Tools</title>
<style>
*{box-sizing:border-box}
body{
 margin:0;min-height:100vh;display:grid;place-items:center;
 padding:20px;font-family:Arial,sans-serif;color:white;
 background:radial-gradient(circle at top left,#174b78,#10172d 55%,#090e1b);
}
.card{
 width:100%;max-width:460px;padding:35px 24px;text-align:center;
 border:1px solid #ffffff20;border-radius:26px;
 background:linear-gradient(145deg,#243b55dd,#141e30ee);
 box-shadow:0 20px 60px #0008;
}
.logo{font-size:55px}
h1{font-size:27px;margin:12px 0}
p{color:#b8c9dd;line-height:1.7}
.status{
 display:inline-block;padding:10px 18px;border-radius:30px;
 color:#68f0b0;background:#123c35;margin:12px 0;
}
.features{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-top:20px}
.features span{
 background:#ffffff12;padding:9px 12px;border-radius:12px;
 font-size:13px;color:#dceaff;
}
</style>
</head>
<body>
<div class="card">
<div class="logo">🤖</div>
<h1>Bangla Smart Tools</h1>
<div class="status">● SERVER ONLINE</div>
<p>আপনার ব্যক্তিগত AI Assistant</p>
<div class="features">
<span>🤖 AI Chat</span>
<span>🌍 Translator</span>
<span>🎙️ Voice</span>
<span>🧮 Calculator</span>
<span>📱 Social Studio</span>
<span>🖼️ Image OCR</span>
</div>
<p>Version 8.0.0</p>
</div>
</body>
</html>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Bangla Smart Tools",
    version: "8.0.0",
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Web server running:", PORT);
});

// ==========================================
// 3. LANGUAGE DATABASE
// ==========================================

const LANGUAGES = [
  { code:"en", name:"English", flag:"🇬🇧", tts:"en" },
  { code:"ar", name:"Arabic", flag:"🇸🇦", tts:"ar" },
  { code:"hi", name:"Hindi", flag:"🇮🇳", tts:"hi" },
  { code:"ur", name:"Urdu", flag:"🇵🇰", tts:"ur" },
  { code:"fr", name:"French", flag:"🇫🇷", tts:"fr" },
  { code:"de", name:"German", flag:"🇩🇪", tts:"de" },
  { code:"es", name:"Spanish", flag:"🇪🇸", tts:"es" },
  { code:"it", name:"Italian", flag:"🇮🇹", tts:"it" },
  { code:"pt", name:"Portuguese", flag:"🇵🇹", tts:"pt" },
  { code:"ru", name:"Russian", flag:"🇷🇺", tts:"ru" },
  { code:"zh", name:"Chinese", flag:"🇨🇳", tts:"zh-CN" },
  { code:"ja", name:"Japanese", flag:"🇯🇵", tts:"ja" },
  { code:"ko", name:"Korean", flag:"🇰🇷", tts:"ko" },
  { code:"tr", name:"Turkish", flag:"🇹🇷", tts:"tr" },
  { code:"id", name:"Indonesian", flag:"🇮🇩", tts:"id" },
  { code:"ms", name:"Malay", flag:"🇲🇾", tts:"ms" },
  { code:"th", name:"Thai", flag:"🇹🇭", tts:"th" },
  { code:"vi", name:"Vietnamese", flag:"🇻🇳", tts:"vi" },
  { code:"nl", name:"Dutch", flag:"🇳🇱", tts:"nl" },
  { code:"pl", name:"Polish", flag:"🇵🇱", tts:"pl" },
  { code:"uk", name:"Ukrainian", flag:"🇺🇦", tts:"uk" },
  { code:"fa", name:"Persian", flag:"🇮🇷", tts:"fa" },
  { code:"he", name:"Hebrew", flag:"🇮🇱", tts:"he" },
  { code:"el", name:"Greek", flag:"🇬🇷", tts:"el" },
  { code:"sv", name:"Swedish", flag:"🇸🇪", tts:"sv" },
  { code:"da", name:"Danish", flag:"🇩🇰", tts:"da" },
  { code:"no", name:"Norwegian", flag:"🇳🇴", tts:"no" },
  { code:"fi", name:"Finnish", flag:"🇫🇮", tts:"fi" },
  { code:"ro", name:"Romanian", flag:"🇷🇴", tts:"ro" },
  { code:"cs", name:"Czech", flag:"🇨🇿", tts:"cs" },
  { code:"hu", name:"Hungarian", flag:"🇭🇺", tts:"hu" },
  { code:"bn", name:"Bengali", flag:"🇧🇩", tts:"bn" },
  { code:"ne", name:"Nepali", flag:"🇳🇵", tts:"ne" },
  { code:"ta", name:"Tamil", flag:"🇮🇳", tts:"ta" },
  { code:"te", name:"Telugu", flag:"🇮🇳", tts:"te" },
  { code:"mr", name:"Marathi", flag:"🇮🇳", tts:"mr" },
  { code:"sw", name:"Swahili", flag:"🇰🇪", tts:"sw" },
  { code:"af", name:"Afrikaans", flag:"🇿🇦", tts:"af" }
];

// ==========================================
// 4. PROFESSIONAL MAIN MENU
// ==========================================

const MAIN_MENU = {
  keyboard: [
    [{ text:"🤖 AI Assistant" }, { text:"🌍 ভাষা অনুবাদ" }],
    [{ text:"🎓 ভাষা শিখুন" }, { text:"🎙️ ভয়েস ইনপুট" }],
    [{ text:"🔊 শেষ উত্তর শুনুন" }, { text:"🧮 ক্যালকুলেটর" }],
    [{ text:"📱 সোশ্যাল মিডিয়া স্টুডিও" }],
    [{ text:"✍️ AI কনটেন্ট" }, { text:"🎬 ভিডিও কনটেন্ট" }],
    [{ text:"📝 সোশ্যাল ক্যাপশন" }, { text:"🔢 নাম্বার কনভার্টার" }],
    [{ text:"📚 গণিতের সূত্র" }, { text:"🖼️ ছবি থেকে লেখা" }],
    [{ text:"🔎 লাইভ তথ্য" }, { text:"ℹ️ About" }],
    [{ text:"❓ Help" }, { text:"🔄 Reset Chat" }],
    [{ text:"🏠 Home" }]
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "এখানে লিখুন অথবা ভয়েস পাঠান..."
};

const HOME_TEXT = `
🌟 স্বাগতম Bangla Smart Tools-এ!

━━━━━━━━━━━━━━━━━━
🤖 YOUR PERSONAL AI ASSISTANT
━━━━━━━━━━━━━━━━━━

✨ আমাদের সেবাসমূহ

🤖 AI Chat Assistant
🌍 Smart Translator
🎓 Language Learning
🎙️ Voice Assistant
🧮 Advanced Calculator
📱 Social Media Studio
🎬 Video Content Studio
🖼️ Image to Text
🔎 Live Information

━━━━━━━━━━━━━━━━━━

নিচের মেনু থেকে আপনার প্রয়োজনীয়
সেবাটি নির্বাচন করুন।
`;

// ==========================================
// 5. SOCIAL MEDIA PLATFORMS
// ==========================================

const PLATFORMS = {
  facebook: {
    name:"Facebook",
    icon:"🔵",
    title:"Facebook Post Title",
    instruction:`
Facebook-এর জন্য সম্পূর্ণ পোস্ট তৈরি করো।
আউটপুটে আলাদা করে দেবে:

1. আকর্ষণীয় Title
2. বিস্তারিত Description
3. সুন্দর Post Caption
4. প্রাসঙ্গিক Hashtags
5. Call to Action

বাংলায় স্বাভাবিক, আকর্ষণীয় ও পাঠযোগ্য ভাষা ব্যবহার করবে।
বিষয়ের বাইরে কোনো তথ্য বানাবে না।
`
  },
  youtube: {
    name:"YouTube",
    icon:"▶️",
    title:"YouTube SEO Studio",
    instruction:`
YouTube ভিডিওর জন্য SEO-friendly কনটেন্ট তৈরি করো।
আউটপুটে আলাদা করে দেবে:

1. SEO-friendly Video Title
2. বিস্তারিত Video Description
3. Relevant Video Tags
4. Hashtags
5. Thumbnail Text Ideas
6. দর্শককে আকৃষ্ট করার Intro

Title যেন বিষয়ভিত্তিক ও পরিষ্কার হয়।
অপ্রাসঙ্গিক বা মিথ্যা SEO দাবি করবে না।
`
  },
  tiktok: {
    name:"TikTok",
    icon:"🎵",
    title:"TikTok Content Maker",
    instruction:`
TikTok ভিডিওর জন্য আকর্ষণীয় কনটেন্ট তৈরি করো।
আউটপুটে আলাদা করে দেবে:

1. Short Video Title
2. প্রথম ৩ সেকেন্ডের Hook
3. Video Caption
4. Relevant Hashtags
5. Short Video Script
6. Voiceover Text
7. দর্শকের সঙ্গে যোগাযোগের Call to Action

কনটেন্ট সংক্ষিপ্ত, স্বাভাবিক ও বিষয়ভিত্তিক হবে।
ভুয়া ভাইরাল হওয়ার নিশ্চয়তা দেবে না।
`
  },
  instagram: {
    name:"Instagram",
    icon:"📸",
    title:"Instagram Studio",
    instruction:`
Instagram-এর জন্য তৈরি করো:
1. আকর্ষণীয় Caption
2. বিস্তারিত Description
3. প্রাসঙ্গিক Hashtags
4. Reel Hook
5. Call to Action
`
  },
  linkedin: {
    name:"LinkedIn",
    icon:"💼",
    title:"LinkedIn Studio",
    instruction:`
LinkedIn-এর জন্য professional post তৈরি করো:
1. Professional Title
2. Detailed Description
3. Main Post
4. Relevant Hashtags
5. Professional Call to Action
`
  }
};

function socialKeyboard() {
  return {
    inline_keyboard: [
      [
        { text:"🔵 Facebook", callback_data:"social_facebook" },
        { text:"▶️ YouTube", callback_data:"social_youtube" }
      ],
      [
        { text:"🎵 TikTok", callback_data:"social_tiktok" },
        { text:"📸 Instagram", callback_data:"social_instagram" }
      ],
      [
        { text:"💼 LinkedIn", callback_data:"social_linkedin" }
      ]
    ]
  };
}

// ==========================================
// 6. SESSION AND RATE LIMIT
// ==========================================

const sessions = new Map();
const userLimits = new Map();
const lastAnswers = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      mode:"chat",
      history:[],
      targetLanguage:null,
      platform:null,
      lastActivity:Date.now()
    });
  }

  const session = sessions.get(userId);
  session.lastActivity = Date.now();
  return session;
}

function checkRateLimit(userId) {
  const now = Date.now();
  const previous = userLimits.get(userId) || [];

  const recent = previous.filter(t => now - t < 60000);

  if (recent.length >= 12) return false;

  recent.push(now);
  userLimits.set(userId, recent);
  return true;
}

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
// 7. COMMON HELPERS
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
        text:`${lang.flag} ${lang.name}`,
        callback_data:`lang_${lang.code}`
      }))
    );
  }

  const navigation = [];

  if (page > 0) {
    navigation.push({
      text:"⬅️ আগের",
      callback_data:`langpage_${page - 1}`
    });
  }

  if (start + perPage < LANGUAGES.length) {
    navigation.push({
      text:"পরের ➡️",
      callback_data:`langpage_${page + 1}`
    });
  }

  if (navigation.length) rows.push(navigation);

  rows.push([
    { text:"🇧🇩 বাংলায় অনুবাদ", callback_data:"lang_bn" }
  ]);

  return { inline_keyboard:rows };
}

// ==========================================
// 8. GEMINI AI ENGINE
// ==========================================

const SYSTEM_INSTRUCTION = `
তুমি Bangla Smart Tools-এর একজন উন্নত AI Assistant।

নিয়ম:
- ব্যবহারকারী বাংলায় লিখলে বাংলায় উত্তর দেবে।
- ব্যবহারকারীর ভাষা বুঝে উত্তর দেবে।
- সহজ, নির্ভুল ও পরিষ্কার ভাষা ব্যবহার করবে।
- প্রয়োজন হলে উদাহরণ দেবে।
- গণিতে ধাপে ধাপে ব্যাখ্যা করবে।
- অনুবাদে মূল অর্থ ও স্বাভাবিক ভাষা বজায় রাখবে।
- বানানো তথ্যকে সত্য বলে উপস্থাপন করবে না।
- লাইভ তথ্য না পেলে সেটি স্পষ্ট করে বলবে।
- অপ্রয়োজনে ব্যক্তিগত তথ্য চাইবে না।
`;

async function askAI(userId, prompt, options = {}) {
  const session = getSession(userId);
  const history = options.noHistory
    ? []
    : session.history.slice(-10);

  const contents = [
    ...history,
    {
      role:"user",
      parts:[{ text:prompt }]
    }
  ];

  const config = {
    systemInstruction:SYSTEM_INSTRUCTION,
    temperature:options.temperature ?? 0.5
  };

  if (options.liveSearch && ENABLE_GOOGLE_SEARCH) {
    config.tools = [{ googleSearch:{} }];
  }

  const response = await ai.models.generateContent({
    model:MODEL,
    contents,
    config
  });

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error("AI থেকে উত্তর পাওয়া যায়নি।");
  }

  if (!options.noHistory) {
    session.history.push(
      { role:"user", parts:[{ text:prompt }] },
      { role:"model", parts:[{ text:answer }] }
    );

    session.history = session.history.slice(-20);
  }

  lastAnswers.set(userId, answer);
  return answer;
}

// ==========================================
// 9. TEXT TO SPEECH
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

  await bot.sendMessage(chatId, "🔊 অডিও তৈরি হচ্ছে...");

  for (const chunk of chunks) {
    try {
      const audioUrl = await getAudioUrl(chunk, {
        lang,
        slow:false,
        host:"https://translate.google.com"
      });

      await bot.sendAudio(chatId, audioUrl, {
        title:"Bangla Smart Tools Voice",
        performer:"AI Assistant"
      });
    } catch (error) {
      console.error("TTS error:", error.message);
      await sendText(chatId, "এই অংশের অডিও তৈরি করা যায়নি।");
      break;
    }
  }
}

// ==========================================
// 10. TRANSLATION
// ==========================================

async function translateText(userId, text, targetCode) {
  const target = getLanguage(targetCode);

  if (!target) throw new Error("ভাষাটি পাওয়া যায়নি।");

  const prompt = `
নিচের লেখাটি ${target.name} ভাষায় অনুবাদ করো।

নিয়ম:
- মূল অর্থ অক্ষুণ্ণ রাখবে।
- স্বাভাবিক ও শুদ্ধ ভাষা ব্যবহার করবে।
- নাম, সংখ্যা ও প্রয়োজনীয় চিহ্ন ঠিক রাখবে।
- শুধু অনুবাদ দেবে।
- অপ্রয়োজনীয় ব্যাখ্যা দেবে না।

লেখা:
${text}
`;

  return askAI(userId, prompt, {
    temperature:0.2,
    noHistory:true
  });
}

// ==========================================
// 11. SAFE ADVANCED CALCULATOR
// ==========================================

const ALLOWED_OPERATORS = [
  "+", "-", "*", "/", "%", "^"
];

const ALLOWED_FUNCTIONS = [
  "sin", "cos", "tan",
  "asin", "acos", "atan",
  "sqrt", "abs",
  "log", "log10",
  "exp", "floor", "ceil",
  "round", "factorial",
  "min", "max", "pow"
];

function validateMathNode(node) {
  if (node.type === "ConstantNode") {
    if (typeof node.value !== "number") {
      throw new Error("শুধু সংখ্যার হিসাব করা যাবে।");
    }
    return;
  }

  if (node.type === "ParenthesisNode") {
    return validateMathNode(node.content);
  }

  if (node.type === "OperatorNode") {
    if (!ALLOWED_OPERATORS.includes(node.op)) {
      throw new Error("এই অপারেটর অনুমোদিত নয়।");
    }

    node.args.forEach(validateMathNode);
    return;
  }

  if (node.type === "SymbolNode") {
    if (!["pi", "e"].includes(node.name)) {
      throw new Error(`এই চিহ্ন অনুমোদিত নয়: ${node.name}`);
    }
    return;
  }

  if (node.type === "FunctionNode") {
    const functionName = node.fn?.name;

    if (!ALLOWED_FUNCTIONS.includes(functionName)) {
      throw new Error("এই গণিতের ফাংশন অনুমোদিত নয়।");
    }

    node.args.forEach(validateMathNode);
    return;
  }

  throw new Error("এই ধরনের গণিতের এক্সপ্রেশন গ্রহণ করা হয়নি।");
}

function calculate(expression) {
  const input = String(expression).trim();

  if (!input || input.length > 200) {
    throw new Error("হিসাবটি সঠিকভাবে লিখুন।");
  }

  const normalized = input.replace(/[০-৯]/g, digit =>
    String("০১২৩৪৫৬৭৮৯".indexOf(digit))
  );

  if (!/^[0-9+\-*/().,%^\sA-Za-z]+$/.test(normalized)) {
    throw new Error("এই ইনপুট গ্রহণ করা হয়নি।");
  }

  const tree = parse(normalized);
  validateMathNode(tree);

  const result = tree.compile().evaluate({
    pi:Math.PI,
    e:Math.E
  });

  if (typeof result !== "number" || !Number.isFinite(result)) {
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
    { temperature:0.2, noHistory:true }
  );
}

// ==========================================
// 12. NUMBER CONVERTER
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
    "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ"
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
// 13. HOME / HELP
// ==========================================

async function showHome(chatId) {
  await bot.sendMessage(chatId, HOME_TEXT, {
    reply_markup:MAIN_MENU
  });
}

async function showLanguageMenu(chatId) {
  await bot.sendMessage(
    chatId,
    "🌍 অনুবাদের ভাষা নির্বাচন করুন।\n\nবাংলা থেকে নির্বাচিত ভাষায় এবং অন্য ভাষা থেকে বাংলায় অনুবাদ করতে পারবেন।",
    { reply_markup:languageKeyboard(0) }
  );
}

async function showHelp(chatId) {
  return sendText(chatId, `
❓ Bangla Smart Tools Help

🤖 AI Assistant:
যেকোনো প্রশ্ন লিখুন।

🌍 ভাষা অনুবাদ:
ভাষা নির্বাচন করে লেখা পাঠান।

🎓 ভাষা শিখুন:
যে ভাষা শিখতে চান তার নাম লিখুন।

🎙️ ভয়েস ইনপুট:
Voice Message পাঠান।

🔊 শেষ উত্তর শুনুন:
সর্বশেষ AI উত্তর শুনুন।

🧮 Calculator:
যেমন: (25+15)*2
এছাড়া sin, cos, sqrt, log ব্যবহার করতে পারবেন।

📱 Social Media Studio:
Facebook, YouTube, TikTok, Instagram ও LinkedIn-এর কনটেন্ট তৈরি করুন।

🎬 Video Content:
ভিডিও স্ক্রিপ্ট ও ভয়েসওভার তৈরি করুন।

🖼️ Image to Text:
প্রথমে ছবি থেকে লেখা নির্বাচন করে ছবি পাঠান।

🔎 Live Information:
লাইভ সার্চ চালু থাকলে সাম্প্রতিক তথ্য খুঁজুন।

🏠 Home:
মূল মেনুতে ফিরুন।
`);
}

// ==========================================
// 14. MENU ROUTER
// ==========================================

async function handleMenu(chatId, userId, text) {
  const session = getSession(userId);

  switch (text) {
    case "🏠 Home":
      session.mode = "chat";
      session.platform = null;
      return showHome(chatId);

    case "🤖 AI Assistant":
      session.mode = "chat";
      session.platform = null;
      return sendText(chatId, "🤖 AI Assistant চালু হয়েছে।\nআপনার প্রশ্ন লিখুন।");

    case "🌍 ভাষা অনুবাদ":
      session.mode = "translate";
      session.targetLanguage = null;
      return showLanguageMenu(chatId);

    case "🎓 ভাষা শিখুন":
      session.mode = "learn";
      return sendText(chatId, "🎓 কোন ভাষা শিখতে চান?\nযেমন: English, Arabic, Hindi, French লিখুন।");

    case "🎙️ ভয়েস ইনপুট":
      session.mode = "voice";
      return sendText(chatId, "🎙️ Telegram মাইক্রোফোন দিয়ে Voice Message পাঠান। আমি সেটিকে লেখায় রূপান্তর করব।");

    case "🔊 শেষ উত্তর শুনুন": {
      const answer = lastAnswers.get(userId);
      if (!answer) return sendText(chatId, "এখনো শোনার মতো কোনো উত্তর নেই।");
      return speakText(chatId, answer);
    }

    case "🧮 ক্যালকুলেটর":
      session.mode = "calculator";
      return sendText(chatId, `
🧮 ADVANCED CALCULATOR

আপনার হিসাব লিখুন।

উদাহরণ:
25+50
(25+15)*2
sqrt(144)
sin(30)
log(100)
2^8

উত্তরের সঙ্গে ধাপে ধাপে ব্যাখ্যা পাবেন।
`);

    case "📱 সোশ্যাল মিডিয়া স্টুডিও":
      session.mode = "social_select";
      return bot.sendMessage(
        chatId,
        "📱 SOCIAL MEDIA CONTENT STUDIO\n\nকোন প্ল্যাটফর্মের জন্য কনটেন্ট তৈরি করবেন?",
        { reply_markup:socialKeyboard() }
      );

    case "✍️ AI কনটেন্ট":
      session.mode = "content";
      return sendText(chatId, "✍️ কী বিষয়ে পোস্ট লিখতে চান?\nবিষয়টি লিখুন।");

    case "🎬 ভিডিও কনটেন্ট":
      session.mode = "video";
      return sendText(chatId, "🎬 ভিডিওর বিষয় লিখুন। আমি Title, Hook, Script ও Voiceover তৈরি করব।");

    case "📝 সোশ্যাল ক্যাপশন":
      session.mode = "caption";
      return sendText(chatId, "📝 ছবি বা ভিডিওর বিষয় লিখুন। আমি Caption ও Hashtags তৈরি করব।");

    case "🔢 নাম্বার কনভার্টার":
      session.mode = "number";
      return sendText(chatId, "🔢 একটি পূর্ণসংখ্যা লিখুন। আমি সেটিকে বাংলা কথায় লিখে দেব।");

    case "📚 গণিতের সূত্র":
      session.mode = "formulas";
      return sendText(chatId, "📚 কোন বিষয়ের সূত্র জানতে চান?\nযেমন: বীজগণিত, জ্যামিতি, ত্রিকোণমিতি, শতকরা।");

    case "🖼️ ছবি থেকে লেখা":
      session.mode = "image";
      return sendText(chatId, "🖼️ এখন একটি ছবি পাঠান। ছবির লেখা শনাক্ত করে দেব।");

    case "🔎 লাইভ তথ্য":
      session.mode = "live";
      return sendText(
        chatId,
        ENABLE_GOOGLE_SEARCH
          ? "🔎 লাইভ তথ্য মোড চালু হয়েছে। আপনার প্রশ্ন লিখুন।"
          : "লাইভ সার্চ চালু করতে Render-এ ENABLE_GOOGLE_SEARCH=true সেট করতে হবে।"
      );

    case "ℹ️ About":
      return sendText(chatId, `
🌟 BANGLA SMART TOOLS

আপনার ব্যক্তিগত AI Assistant।

সুবিধাসমূহ:
• AI Chat
• Smart Translation
• Language Learning
• Voice Input & Output
• Advanced Calculator
• Facebook Content Studio
• YouTube SEO Studio
• TikTok Content Maker
• Instagram Studio
• LinkedIn Studio
• Video Content
• Image to Text
• Live Information

Version: 8.0.0
`);

    case "❓ Help":
      return showHelp(chatId);

    case "🔄 Reset Chat":
      session.history = [];
      session.mode = "chat";
      session.platform = null;
      session.targetLanguage = null;
      lastAnswers.delete(userId);
      return sendText(chatId, "🔄 নতুন চ্যাট শুরু হয়েছে।");

    default:
      return null;
  }
}

// ==========================================
// 15. ALL CALLBACKS IN ONE HANDLER
// ==========================================

bot.on("callback_query", async query => {
  const userId = String(query.from.id);
  const chatId = query.message?.chat?.id;
  const data = query.data || "";

  try {
    await bot.answerCallbackQuery(query.id);

    if (!chatId) return;

    if (data.startsWith("langpage_")) {
      const page = Number(data.split("_")[1]) || 0;

      return bot.editMessageReplyMarkup(
        languageKeyboard(page),
        {
          chat_id:chatId,
          message_id:query.message.message_id
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

    if (data.startsWith("social_")) {
      const platformKey = data.replace("social_", "");
      const platform = PLATFORMS[platformKey];

      if (!platform) return;

      const session = getSession(userId);
      session.mode = "social_content";
      session.platform = platformKey;

      return sendText(
        chatId,
        `${platform.icon} ${platform.name} Content Studio চালু হয়েছে!\n\n${platform.title}\n\nএখন পোস্ট বা ভিডিওর বিষয় লিখুন। আমি Title, Description, Caption, Tags ও Hashtags আলাদা করে তৈরি করব।`
      );
    }

    if (data === "speak_last") {
      const answer = lastAnswers.get(userId);

      if (!answer) return sendText(chatId, "শোনার মতো কোনো উত্তর নেই।");

      return speakText(chatId, answer);
    }

    if (data === "new_chat") {
      const session = getSession(userId);
      session.history = [];
      session.mode = "chat";
      session.platform = null;

      return sendText(chatId, "💬 নতুন AI চ্যাট শুরু হয়েছে। আপনার প্রশ্ন লিখুন।");
    }

  } catch (error) {
    console.error("Callback error:", error.message);
  }
});

// ==========================================
// 16. DOWNLOAD TELEGRAM FILE
// ==========================================

async function downloadTelegramFile(fileId, maxSize = 18 * 1024 * 1024) {
  const fileUrl = await bot.getFileLink(fileId);
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error("ফাইল ডাউনলোড করা যায়নি।");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > maxSize) {
    throw new Error("ফাইলটি অনেক বড়। ছোট ফাইল পাঠান।");
  }

  return buffer;
}

// ==========================================
// 17. VOICE TO TEXT
// ==========================================

async function transcribeVoice(chatId, userId, voice) {
  await typing(chatId);

  const buffer = await downloadTelegramFile(voice.file_id);

  const result = await ai.models.generateContent({
    model:MODEL,
    contents:[
      {
        inlineData:{
          data:buffer.toString("base64"),
          mimeType:voice.mime_type || "audio/ogg"
        }
      },
      "এই অডিওতে যা বলা হয়েছে তা হুবহু লেখায় রূপান্তর করো। যে ভাষায় বলা হয়েছে সেই ভাষাতেই লিখবে। শুধু ট্রান্সক্রিপশন দাও।"
    ]
  });

  const transcript = result.text?.trim();

  if (!transcript) throw new Error("অডিও থেকে লেখা পাওয়া যায়নি।");

  const session = getSession(userId);
  session.mode = "chat";
  session.history.push({
    role:"user",
    parts:[{ text:transcript }]
  });

  lastAnswers.set(userId, transcript);

  return sendText(
    chatId,
    `🎙️ আপনার কথার লেখা:\n\n${transcript}\n\nএখন চাইলে AI-কে প্রশ্ন করতে পারেন।`
  );
}

// ==========================================
// 18. IMAGE OCR
// ==========================================

async function readImage(chatId, userId, photo) {
  await typing(chatId);

  const buffer = await downloadTelegramFile(photo.file_id);

  const result = await ai.models.generateContent({
    model:MODEL,
    contents:[
      {
        inlineData:{
          data:buffer.toString("base64"),
          mimeType:"image/jpeg"
        }
      },
      "ছবির মধ্যে থাকা লেখা শনাক্ত করে পরিষ্কারভাবে লিখে দাও। লেখা না থাকলে ছবির সংক্ষিপ্ত বিবরণ দাও।"
    ]
  });

  const answer = result.text?.trim() || "ছবিটি পড়া যায়নি।";

  lastAnswers.set(userId, answer);
  return sendText(chatId, `🖼️ IMAGE RESULT\n\n${answer}`);
}

// ==========================================
// 19. TEXT MESSAGE PROCESSOR
// ==========================================

async function processText(chatId, userId, text) {
  const session = getSession(userId);
  const mode = session.mode;

  if (mode === "translate") {
    if (!session.targetLanguage) return showLanguageMenu(chatId);

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
      `${language.flag} ${language.name} Translation:\n\n${answer}`,
      {
        reply_markup:{
          inline_keyboard:[
            [
              { text:"🔊 শুনুন", callback_data:"speak_last" }
            ],
            [
              { text:"🌍 ভাষা বদলান", callback_data:"lang_bn" }
            ]
          ]
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
      `🧮 ADVANCED CALCULATOR\n\nহিসাব: ${text}\n\n✅ ফলাফল: ${result}\n\n📖 ধাপে ধাপে ব্যাখ্যা:\n${explanation}`
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
      `আমি ${text} ভাষা শিখতে চাই। একজন শিক্ষক হিসেবে ৫টি দরকারি শব্দ শেখাও। প্রতিটির মূল শব্দ, বাংলা অর্থ, বাংলা উচ্চারণ এবং একটি সহজ বাক্য দাও। শেষে ছোট কুইজ দাও।`,
      { temperature:0.4 }
    );

    return sendText(chatId, answer);
  }

  if (mode === "social_content") {
    const platform = PLATFORMS[session.platform];

    if (!platform) {
      session.mode = "social_select";
      return bot.sendMessage(
        chatId,
        "প্ল্যাটফর্ম নির্বাচন করুন:",
        { reply_markup:socialKeyboard() }
      );
    }

    await typing(chatId);

    const answer = await askAI(
      userId,
      `${platform.instruction}\n\nবিষয়:\n${text}`,
      { temperature:0.7, noHistory:true }
    );

    return sendText(
      chatId,
      `${platform.icon} ${platform.name} CONTENT STUDIO\n\n${answer}`,
      {
        reply_markup:{
          inline_keyboard:[
            [
              { text:"🔊 শুনুন", callback_data:"speak_last" }
            ],
            [
              { text:"🔄 অন্য প্ল্যাটফর্ম", callback_data:"social_facebook" }
            ]
          ]
        }
      }
    );
  }

  if (mode === "content") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `এই বিষয় নিয়ে মানসম্মত সোশ্যাল মিডিয়া পোস্ট তৈরি করো: ${text}। আকর্ষণীয় শিরোনাম, বিস্তারিত পোস্ট, ক্যাপশন ও প্রাসঙ্গিক হ্যাশট্যাগ আলাদা করে দাও।`,
      { temperature:0.7 }
    );

    return sendText(chatId, answer);
  }

  if (mode === "video") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `এই বিষয় নিয়ে একটি ভিডিও তৈরির পরিকল্পনা করো: ${text}। ভিডিওর Title, Hook, দৃশ্যভিত্তিক Script, Voiceover ও শেষের Call to Action দাও।`,
      { temperature:0.7 }
    );

    return sendText(chatId, answer);
  }

  if (mode === "caption") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `এই বিষয় বা ছবির জন্য ৩টি আলাদা সোশ্যাল মিডিয়া Caption এবং প্রাসঙ্গিক Hashtags তৈরি করো: ${text}`,
      { temperature:0.7 }
    );

    return sendText(chatId, answer);
  }

  if (mode === "formulas") {
    await typing(chatId);

    const answer = await askAI(
      userId,
      `বাংলায় ${text} বিষয়ে প্রয়োজনীয় গণিতের সূত্র, প্রতীকগুলোর অর্থ এবং সহজ উদাহরণ দাও।`,
      { temperature:0.3 }
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
      `Google Search ব্যবহার করে এই প্রশ্নের সাম্প্রতিক তথ্য, তারিখ এবং নির্ভরযোগ্য সূত্র উল্লেখ করো। তথ্য না পেলে অনুমান করবে না। প্রশ্ন: ${text}`,
      { liveSearch:true, temperature:0.2 }
    );

    return sendText(chatId, answer);
  }

  // Default AI Chat
  await typing(chatId);

  const answer = await askAI(userId, text);

  return sendText(
    chatId,
    answer,
    {
      reply_markup:{
        inline_keyboard:[
          [
            { text:"🔊 উত্তর শুনুন", callback_data:"speak_last" },
            { text:"💬 নতুন চ্যাট", callback_data:"new_chat" }
          ]
        ]
      }
    }
  );
}

// ==========================================
// 20. MAIN TELEGRAM MESSAGE HANDLER
// ==========================================

bot.on("message", async message => {
  const chatId = message.chat.id;
  const userId = String(message.from?.id || "");

  if (!userId || message.chat.type !== "private") return;

  try {
    // Voice Message
    if (message.voice) {
      if (!checkRateLimit(userId)) {
        return sendText(chatId, "⚡ একটু অপেক্ষা করে আবার চেষ্টা করুন।");
      }

      return await transcribeVoice(chatId, userId, message.voice);
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
        return sendText(chatId, "⚡ একটু অপেক্ষা করে আবার চেষ্টা করুন।");
      }

      const photo = message.photo[message.photo.length - 1];

      return await readImage(chatId, userId, photo);
    }

    // Unsupported document
    if (message.document) {
      return sendText(
        chatId,
        "এই বটে বর্তমানে PDF Assistant নেই। ছবি থেকে লেখা পড়তে ছবি পাঠান।"
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
      session.platform = null;
      session.targetLanguage = null;
      return showHome(chatId);
    }

    if (text === "/menu") return showHome(chatId);
    if (text === "/help") return showHelp(chatId);

    if (text === "/reset") {
      const session = getSession(userId);
      session.history = [];
      session.mode = "chat";
      session.platform = null;
      lastAnswers.delete(userId);
      return sendText(chatId, "🔄 নতুন চ্যাট শুরু হয়েছে।");
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

    await processText(chatId, userId, text);

  } catch (error) {
    console.error("Message error:", error);

    let messageText =
      "দুঃখিত, অনুরোধটি সম্পন্ন করা যায়নি। একটু পরে আবার চেষ্টা করুন।";

    const errorMessage = String(error.message || "");

    if (
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota")
    ) {
      messageText =
        "⚠️ AI সার্ভারের ব্যবহারসীমা সাময়িকভাবে পূর্ণ হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।";
    } else if (
      errorMessage.includes("API key") ||
      errorMessage.includes("401") ||
      errorMessage.includes("403")
    ) {
      messageText =
        "⚠️ AI API সেটিংসে সমস্যা আছে। সার্ভার অ্যাডমিনকে জানাতে হবে।";
    } else if (errorMessage.length < 250) {
      messageText = `⚠️ ${errorMessage}`;
    }

    try {
      await sendText(chatId, messageText);
    } catch (sendError) {
      console.error("Error reply failed:", sendError.message);
    }
  }
});

// ==========================================
// 21. BOT COMMANDS AND ERROR HANDLING
// ==========================================

bot.setMyCommands([
  { command:"start", description:"মূল মেনু চালু করুন" },
  { command:"menu", description:"মূল মেনু দেখুন" },
  { command:"help", description:"সাহায্য নিন" },
  { command:"reset", description:"নতুন AI চ্যাট শুরু করুন" }
]).catch(error => {
  console.error("Bot commands error:", error.message);
});

bot.on("polling_error", error => {
  console.error("Telegram polling error:", error.message);
});

bot.on("webhook_error", error => {
  console.error("Telegram webhook error:", error.message);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled rejection:", error);
});

console.log("=================================");
console.log("Bangla Smart Tools v8.0.0");
console.log("AI Model:", MODEL);
console.log("Google Search:", ENABLE_GOOGLE_SEARCH);
console.log("Social Studio: Facebook / YouTube / TikTok / Instagram / LinkedIn");
console.log("PDF Assistant: Removed");
console.log("Telegram Bot: Starting...");
console.log("=================================");
