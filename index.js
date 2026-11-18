import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { create, all } from "mathjs";
import { getAudioUrl } from "google-tts-api";
import { randomUUID } from "node:crypto";

const app = express();
const math = create(all);

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-4-hydrogen";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN missing. Add it in Render Environment Variables.");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

app.get("/", (_req, res) => {
  res.send("🌟 Bangla Smart Tools is running.");
});

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    bot: "Bangla Smart Tools",
    ai: Boolean(ai)
  });
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

// ==================================
// SESSION
// ==================================

const sessions = new Map();
const audioTexts = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, {
      mode: "menu",
      platform: null,
      language: null,
      expression: ""
    });
  }

  return sessions.get(id);
}

// ==================================
// MAIN MENU
// ==================================

const mainMenu = {
  keyboard: [
    ["✍️ AI অটো পোস্ট", "🎬 ভিডিও কনটেন্ট"],
    ["🧮 ক্যালকুলেটর", "🌐 অনুবাদ"],
    ["📱 সোশ্যাল ক্যাপশন", "🔢 সংখ্যা রূপান্তর"],
    ["📚 গণিতের সূত্র", "ℹ️ About"],
    ["🏠 মেইন মেনু"]
  ],
  resize_keyboard: true,
  is_persistent: true
};

// ==================================
// AUDIO SYSTEM
// ==================================

function audioKeyboard(text, lang = "bn") {
  const id = randomUUID().slice(0, 12);

  audioTexts.set(id, {
    text: String(text).slice(0, 5000),
    lang
  });

  if (audioTexts.size > 500) {
    const oldest = audioTexts.keys().next().value;
    audioTexts.delete(oldest);
  }

  return {
    inline_keyboard: [[
      {
        text: "🔊 লেখা শুনুন",
        callback_data: `speak:${id}`
      },
      {
        text: "🏠 মেইন মেনু",
        callback_data: "home"
      }
    ]]
  };
}

function splitMessage(text, max = 3800) {
  const result = [];
  let remaining = String(text);

  while (remaining.length > max) {
    let cut = remaining.lastIndexOf("\n", max);

    if (cut < max * 0.5) {
      cut = max;
    }

    result.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }

  if (remaining) {
    result.push(remaining);
  }

  return result.length ? result : [""];
}

async function sendRichText(chatId, text, options = {}, lang = "bn") {
  const safeText = String(text || "কোনো লেখা পাওয়া যায়নি।");
  const chunks = splitMessage(safeText, 3800);

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;

    await bot.sendMessage(chatId, chunks[i], {
      ...options,
      ...(isLast
        ? { reply_markup: audioKeyboard(safeText, lang) }
        : {})
    });
  }
}

function splitForSpeech(text, max = 180) {
  const words = String(text)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

  const chunks = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > max && current) {
      chunks.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }

  if (current) chunks.push(current);

  return chunks.slice(0, 12);
}

async function sendSpeech(chatId, text, lang) {
  const parts = splitForSpeech(text);

  if (!parts.length) {
    throw new Error("শোনার মতো লেখা পাওয়া যায়নি।");
  }

  await bot.sendMessage(
    chatId,
    `🔊 অডিও তৈরি হচ্ছে (${parts.length} অংশ)...`
  );

  for (const part of parts) {
    const url = getAudioUrl(part, {
      lang: lang || "bn",
      slow: false,
      host: "https://translate.google.com"
    });

    await bot.sendVoice(chatId, url);
  }
}

// ==================================
// HOME
// ==================================

async function showHome(chatId, name = "বন্ধু") {
  const s = getSession(chatId);

  s.mode = "menu";
  s.platform = null;
  s.language = null;
  s.expression = "";

  return bot.sendMessage(
    chatId,
    `🌟 স্বাগতম ${name}!

🤖 BANGLA SMART TOOLS

আপনার AI ডিজিটাল সহকারী।

✍️ AI দিয়ে পোস্ট ও ক্যাপশন
🎬 ভিডিও টাইটেল ও বিবরণ
🧮 সাধারণ ও উন্নত ক্যালকুলেটর
🌐 দ্বিমুখী বহু ভাষার অনুবাদ
🔊 লেখা শুনুন — Audio Support

নিচের মেনু থেকে একটি ফিচার নির্বাচন করুন।`,
    { reply_markup: mainMenu }
  );
}

// ==================================
// ABOUT
// ==================================

const ABOUT_TEXT =
  "🌟 ABOUT BANGLA SMART TOOLS\n\n" +
  "Bangla Smart Tools একটি AI-ভিত্তিক বহুমুখী ডিজিটাল সহকারী।\n\n" +
  "✨ আমাদের সুবিধাসমূহ:\n\n" +
  "✍️ AI Auto Post — বিভিন্ন সোশ্যাল প্ল্যাটফর্মের পোস্ট।\n\n" +
  "🎬 Video Content — টাইটেল, বিবরণ ও আইডিয়া।\n\n" +
  "🧮 Smart Calculator — সাধারণ ও উন্নত হিসাব।\n\n" +
  "🌐 Translator — বাংলা, আরবি, ইংরেজিসহ বহু ভাষায় অনুবাদ।\n\n" +
  "🔊 Text to Speech — সমর্থিত ভাষায় লেখা শুনুন।\n\n" +
  "🔢 Number Converter — বাংলা ও ইংরেজি সংখ্যা।\n\n" +
  "📚 Math Formulas — প্রয়োজনীয় গণিতের সূত্র।\n\n" +
  "🎯 আমাদের লক্ষ্য: প্রযুক্তিকে সহজ ও সবার ব্যবহার উপযোগী করা।\n\n" +
  "ধন্যবাদ Bangla Smart Tools ব্যবহার করার জন্য। ❤️";

// ==================================
// GEMINI AI
// ==================================

async function askAI(prompt) {
  if (!ai) {
    throw new Error(
      "Gemini API Key সেট করা নেই। Render Environment-এ GEMINI_API_KEY যোগ করুন।"
    );
  }

  const result = await ai.interactions.create({
    model: MODEL,
    input: prompt
  });

  const answer = result?.output_text?.trim();

  if (!answer) {
    throw new Error("AI থেকে কোনো লেখা পাওয়া যায়নি।");
  }

  return answer;
}

// ==================================
// AI POST WRITER
// ==================================

const platforms = [
  ["🔵 Facebook", "facebook"],
  ["🎵 TikTok", "tiktok"],
  ["▶️ YouTube", "youtube"],
  ["📸 Instagram", "instagram"],
  ["✈️ Telegram", "telegram"],
  ["𝕏 X / Twitter", "x"],
  ["💼 LinkedIn", "linkedin"],
  ["🌍 সব প্ল্যাটফর্ম", "all"]
];

const platformNames = {
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  telegram: "Telegram",
  x: "X / Twitter",
  linkedin: "LinkedIn",
  all: "সব প্ল্যাটফর্ম"
};

function platformKeyboard() {
  const rows = [];

  for (let i = 0; i < platforms.length; i += 2) {
    rows.push(
      platforms.slice(i, i + 2).map(p => ({
        text: p[0],
        callback_data: "platform:" + p[1]
      }))
    );
  }

  rows.push([
    {
      text: "🏠 মেইন মেনু",
      callback_data: "home"
    }
  ]);

  return { inline_keyboard: rows };
}

function startPost(chatId) {
  const s = getSession(chatId);

  s.mode = "choose_platform";
  s.platform = null;

  return bot.sendMessage(
    chatId,
    "✍️ AI AUTO POST STUDIO\n\nকোন প্ল্যাটফর্মের জন্য কনটেন্ট চান?",
    { reply_markup: platformKeyboard() }
  );
}

async function generatePost(topic, platform) {
  const instructions = {
    facebook:
      "Facebook-এর জন্য শিরোনাম, আকর্ষণীয় মূল লেখা, CTA ও হ্যাশট্যাগ দিন।",

    tiktok:
      "TikTok-এর জন্য Hook, ছোট ক্যাপশন, ভিডিও আইডিয়া ও হ্যাশট্যাগ দিন।",

    youtube:
      "YouTube-এর জন্য ৩টি Title, Description, Hashtags ও Tags দিন।",

    instagram:
      "Instagram-এর জন্য Caption, Emoji ও Hashtags দিন।",

    telegram:
      "Telegram চ্যানেলের জন্য শিরোনাম, পোস্ট ও হ্যাশট্যাগ দিন।",

    x:
      "X-এর জন্য সংক্ষিপ্ত, আকর্ষণীয় পোস্ট লিখুন।",

    linkedin:
      "LinkedIn-এর জন্য পেশাদার ও তথ্যবহুল পোস্ট লিখুন।",

    all:
      "Facebook, TikTok, YouTube, Instagram, Telegram, X ও LinkedIn-এর জন্য আলাদা কনটেন্ট তৈরি করুন।"
  };

  return askAI(`
আপনি একজন দক্ষ বাংলা ও ইংরেজি কনটেন্ট রাইটার।

বিষয়: ${topic}

প্ল্যাটফর্ম: ${platformNames[platform] || platform}

কাজ:
${instructions[platform] || instructions.facebook}

নিয়ম:
- শুদ্ধ ও স্বাভাবিক ভাষা ব্যবহার করুন।
- প্রাসঙ্গিক ইমোজি দিন।
- প্রাসঙ্গিক হ্যাশট্যাগ দিন।
- মিথ্যা তথ্য বানাবেন না।
- কপি করার উপযোগী লেখা দিন।
`);
}

// ==================================
// VIDEO CONTENT
// ==================================

async function generateVideo(topic) {
  return askAI(`
আপনি একজন ভিডিও কনটেন্ট বিশেষজ্ঞ।

ভিডিওর বিষয়: ${topic}

বাংলায় তৈরি করুন:

1. পাঁচটি আকর্ষণীয় ভিডিও Title
2. SEO Description
3. Hashtags
4. YouTube Tags
5. Thumbnail-এর জন্য তিনটি ছোট বাক্য
6. ভিডিওর সংক্ষিপ্ত Outline

কোনো মিথ্যা দাবি করবেন না।
`);
}

// ==================================
// CALCULATOR
// ==================================

function normalize(input) {
  const bn = "০১২৩৪৫৬৭৮৯";

  return String(input)
    .replace(/[০-৯]/g, d => bn.indexOf(d))
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/π/g, "pi")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
}

const allowedFunctions = new Set([
  "sqrt", "abs", "sin", "cos", "tan",
  "asin", "acos", "atan", "sinh", "cosh",
  "tanh", "log", "log10", "exp",
  "floor", "ceil", "round", "factorial",
  "min", "max", "pow"
]);

function calculate(input) {
  const expression = normalize(input);

  if (!expression || expression.length > 100) {
    throw new Error("সঠিক হিসাব লিখুন।");
  }

  const tree = math.parse(expression);

  tree.traverse(node => {
    if (node.type === "ConstantNode") {
      if (typeof node.value !== "number") {
        throw new Error("শুধু সংখ্যা ব্যবহার করুন।");
      }
    } else if (node.type === "SymbolNode") {
      if (!["pi", "e"].includes(node.name)) {
        throw new Error("অনুমোদিত নয়: " + node.name);
      }
    } else if (node.type === "OperatorNode") {
      if (!["+", "-", "*", "/", "%", "^", "!"].includes(node.op)) {
        throw new Error("অপারেটর অনুমোদিত নয়।");
      }
    } else if (node.type === "FunctionNode") {
      const functionName = node.fn?.name;

      if (!allowedFunctions.has(functionName)) {
        throw new Error("এই ফাংশন অনুমোদিত নয়।");
      }
    } else if (node.type !== "ParenthesisNode") {
      throw new Error("এই ইনপুট গ্রহণযোগ্য নয়।");
    }
  });

  const answer = tree.evaluate();

  if (typeof answer !== "number" || !Number.isFinite(answer)) {
    throw new Error("ফলাফল নির্ণয় করা যায়নি।");
  }

  return {
    expression,
    answer: math.format(answer, { precision: 14 })
  };
}

const calcRows = [
  ["C", "(", ")", "⌫"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", ".", "^", "+"],
  ["√", "x²", "x³", "%"],
  ["sin", "cos", "tan", "log"],
  ["π", "e", "!", "="],
  ["🏠 মেনু"]
];

function calcKeyboard() {
  return {
    inline_keyboard: calcRows.map(row =>
      row.map(key => ({
        text: key,
        callback_data: "calc:" + key
      }))
    )
  };
}

function showCalculator(chatId) {
  const s = getSession(chatId);

  s.mode = "calculator";
  s.expression = "";

  return bot.sendMessage(
    chatId,
    "🧮 SMART CALCULATOR\n\n" +
    "বাংলা বা ইংরেজি সংখ্যা ব্যবহার করুন।\n" +
    "উদাহরণ: ২৫ × ১২ + ৫০\n\n" +
    "sin, cos, tan ও log-এর ক্ষেত্রে বন্ধনী বন্ধ করুন।",
    { reply_markup: calcKeyboard() }
  );
}

// ==================================
// MULTI-LANGUAGE TRANSLATOR
// ==================================

const languages = [
  ["🇧🇩 বাংলা", "bn"],
  ["🇬🇧 English", "en"],
  ["🇸🇦 العربية (Arabic)", "ar"],
  ["🇮🇳 हिन्दी (Hindi)", "hi"],
  ["🇵🇰 اردو (Urdu)", "ur"],
  ["🇫🇷 Français", "fr"],
  ["🇩🇪 Deutsch", "de"],
  ["🇪🇸 Español", "es"],
  ["🇨🇳 中文", "zh"],
  ["🇯🇵 日本語", "ja"],
  ["🇰🇷 한국어", "ko"],
  ["🇹🇷 Türkçe", "tr"],
  ["🇮🇷 فارسی", "fa"],
  ["🇮🇩 Indonesia", "id"],
  ["🇲🇾 Melayu", "ms"],
  ["🇹🇭 ไทย", "th"],
  ["🇻🇳 Tiếng Việt", "vi"],
  ["🇷🇺 Русский", "ru"],
  ["🇮🇹 Italiano", "it"],
  ["🇵🇹 Português", "pt"],
  ["🇳🇱 Nederlands", "nl"],
  ["🇵🇱 Polski", "pl"],
  ["🇺🇦 Українська", "uk"],
  ["🇬🇷 Ελληνικά", "el"],
  ["🇸🇪 Svenska", "sv"],
  ["🇳🇴 Norsk", "no"],
  ["🇩🇰 Dansk", "da"],
  ["🇫🇮 Suomi", "fi"],
  ["🇮🇱 עברית", "he"],
  ["🇳🇵 नेपाली", "ne"],
  ["🇱🇰 සිංහල", "si"],
  ["🇰🇪 Kiswahili", "sw"]
];

function languageKeyboard(page = 0) {
  const selected = languages.slice(page * 10, page * 10 + 10);
  const rows = [];

  for (let i = 0; i < selected.length; i += 2) {
    rows.push(
      selected.slice(i, i + 2).map(lang => ({
        text: lang[0],
        callback_data: "lang:" + lang[1]
      }))
    );
  }

  const nav = [];

  if (page > 0) {
    nav.push({
      text: "⬅️ আগের",
      callback_data: "langpage:" + (page - 1)
    });
  }

  if ((page + 1) * 10 < languages.length) {
    nav.push({
      text: "পরের ➡️",
      callback_data: "langpage:" + (page + 1)
    });
  }

  if (nav.length) rows.push(nav);

  rows.push([
    {
      text: "🏠 মেইন মেনু",
      callback_data: "home"
    }
  ]);

  return { inline_keyboard: rows };
}

function showLanguages(chatId) {
  const s = getSession(chatId);

  s.mode = "translation";
  s.language = null;

  return bot.sendMessage(
    chatId,
    "🌐 অনুবাদ\n\n" +
    "যে ভাষায় অনুবাদ চান সেটি নির্বাচন করুন।\n" +
    "বট আপনার লেখার মূল ভাষা নিজে শনাক্ত করবে।\n\n" +
    "উদাহরণ: আরবি লেখা দিয়ে বাংলা নির্বাচন করলে আরবি → বাংলা হবে।",
    { reply_markup: languageKeyboard(0) }
  );
}

async function translateText(text, targetCode) {
  const target =
    languages.find(item => item[1] === targetCode)?.[0] || targetCode;

  return askAI(`
Translate the text below into the language identified by code "${targetCode}" (${target}).

Automatically detect the source language.
Preserve meaning, names, numbers and tone.
If the source is already the target language, return it unchanged.
Do not explain.
Do not add quotation marks.
Return only the translation.

TEXT:
${text}
`);
}

// ==================================
// NUMBER CONVERTER
// ==================================

function convertDigits(value, toBengali) {
  const bn = "০১২৩৪৫৬৭৮৯";
  const en = "0123456789";

  return String(value).replace(/[0-9০-৯]/g, d => {
    if (toBengali) {
      const index = en.indexOf(d);
      return index >= 0 ? bn[index] : d;
    }

    const index = bn.indexOf(d);
    return index >= 0 ? en[index] : d;
  });
}

// ==================================
// MATH FORMULAS
// ==================================

const formulas =
  "📚 গণিতের প্রয়োজনীয় সূত্র\n\n" +
  "বর্গক্ষেত্রের ক্ষেত্রফল = বাহু × বাহু\n" +
  "আয়তক্ষেত্রের ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ\n" +
  "ত্রিভুজের ক্ষেত্রফল = ½ × ভূমি × উচ্চতা\n" +
  "বৃত্তের ক্ষেত্রফল = π × r²\n" +
  "বৃত্তের পরিধি = 2πr\n\n" +
  "(a+b)² = a² + 2ab + b²\n" +
  "(a-b)² = a² - 2ab + b²\n" +
  "a²-b² = (a-b)(a+b)";

// ==================================
// CALLBACK HANDLER
// ==================================

bot.on("callback_query", async query => {
  const chatId = query.message?.chat?.id;

  if (!chatId) return;

  const s = getSession(chatId);
  const data = query.data || "";

  await bot.answerCallbackQuery(query.id).catch(() => {});

  try {
    if (data === "home") {
      return showHome(chatId, query.from.first_name);
    }

    if (data.startsWith("speak:")) {
      const item = audioTexts.get(data.slice(6));

      if (!item) {
        throw new Error("এই অডিও অনুরোধের মেয়াদ শেষ। লেখাটি আবার তৈরি করুন।");
      }

      return await sendSpeech(chatId, item.text, item.lang);
    }

    if (data.startsWith("platform:")) {
      s.platform = data.split(":")[1];
      s.mode = "post_topic";

      return bot.sendMessage(
        chatId,
        "✍️ কোন বিষয়ে পোস্ট লিখব?\nউদাহরণ: বাংলাদেশের প্রাকৃতিক সৌন্দর্য"
      );
    }

    if (data.startsWith("langpage:")) {
      const page = Math.max(0, Number(data.split(":")[1]) || 0);

      return bot.editMessageReplyMarkup(languageKeyboard(page), {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    }

    if (data.startsWith("lang:")) {
      s.language = data.split(":")[1];
      s.mode = "translation";

      return bot.sendMessage(
        chatId,
        "✍️ এখন যে কোনো ভাষার লেখা পাঠান। আমি ভাষা শনাক্ত করে নির্বাচিত ভাষায় অনুবাদ করব।"
      );
    }

    if (data.startsWith("calc:")) {
      const key = data.slice(5);

      if (key === "🏠 মেনু") {
        return showHome(chatId, query.from.first_name);
      }

      if (key === "C") {
        s.expression = "";
      } else if (key === "⌫") {
        s.expression = s.expression.slice(0, -1);
      } else if (key === "=") {
        const result = calculate(s.expression);

        return sendRichText(
          chatId,
          `🧮 হিসাব: ${result.expression}\n\n✅ উত্তর: ${result.answer}`,
          { reply_markup: mainMenu },
          "bn"
        );
      } else {
        const symbols = {
          "÷": "/",
          "×": "*",
          "−": "-",
          "√": "sqrt(",
          "x²": "^2",
          "x³": "^3",
          "sin": "sin(",
          "cos": "cos(",
          "tan": "tan(",
          "log": "log(",
          "π": "pi"
        };

        s.expression += Object.hasOwn(symbols, key)
          ? symbols[key]
          : key;
      }

      return bot.editMessageText(
        "🧮 আপনার হিসাব:\n\n" + (s.expression || "খালি"),
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: calcKeyboard()
        }
      );
    }
  } catch (error) {
    console.error("Callback error:", error);

    return bot.sendMessage(
      chatId,
      "❌ " + error.message,
      { reply_markup: mainMenu }
    );
  }
});

// ==================================
// START COMMAND
// ==================================

bot.onText(/^\/start(?:@\w+)?(?:\s.*)?$/, msg => {
  showHome(msg.chat.id, msg.from.first_name);
});

// ==================================
// MESSAGE HANDLER
// ==================================

bot.on("message", async msg => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const s = getSession(chatId);

  try {
    if (text === "🏠 মেইন মেনু") {
      return showHome(chatId, msg.from.first_name);
    }

    if (text === "✍️ AI অটো পোস্ট") {
      return startPost(chatId);
    }

    if (text === "🎬 ভিডিও কনটেন্ট") {
      s.mode = "video_topic";

      return bot.sendMessage(
        chatId,
        "🎬 ভিডিওর বিষয় লিখে পাঠান।"
      );
    }

    if (text === "🧮 ক্যালকুলেটর") {
      return showCalculator(chatId);
    }

    if (text === "🌐 অনুবাদ") {
      return showLanguages(chatId);
    }

    if (text === "📱 সোশ্যাল ক্যাপশন") {
      s.mode = "social_topic";

      return bot.sendMessage(
        chatId,
        "📱 ক্যাপশনের বিষয় লিখুন।"
      );
    }

    if (text === "🔢 সংখ্যা রূপান্তর") {
      s.mode = "numbers";

      return bot.sendMessage(
        chatId,
        "বাংলা অথবা ইংরেজি সংখ্যা পাঠান।"
      );
    }

    if (text === "📚 গণিতের সূত্র") {
      return sendRichText(
        chatId,
        formulas,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    if (text === "ℹ️ About") {
      return sendRichText(
        chatId,
        ABOUT_TEXT,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    // AI POST
    if (s.mode === "post_topic") {
      if (text.length > 1000) {
        return bot.sendMessage(
          chatId,
          "বিষয়টি ১০০০ অক্ষরের মধ্যে লিখুন।"
        );
      }

      await bot.sendMessage(chatId, "⏳ AI পোস্ট তৈরি করছে...");

      const result = await generatePost(
        text,
        s.platform || "facebook"
      );

      s.mode = "menu";
      s.platform = null;

      return sendRichText(
        chatId,
        result,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    // VIDEO
    if (s.mode === "video_topic") {
      await bot.sendMessage(
        chatId,
        "⏳ ভিডিও কনটেন্ট তৈরি হচ্ছে..."
      );

      const result = await generateVideo(text);
      s.mode = "menu";

      return sendRichText(
        chatId,
        result,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    // SOCIAL CAPTION
    if (s.mode === "social_topic") {
      await bot.sendMessage(
        chatId,
        "⏳ ক্যাপশন তৈরি হচ্ছে..."
      );

      const result = await generatePost(text, "instagram");
      s.mode = "menu";

      return sendRichText(
        chatId,
        result,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    // TRANSLATION
    if (s.mode === "translation" && s.language) {
      if (text.length > 1500) {
        return bot.sendMessage(
          chatId,
          "অনুগ্রহ করে ১৫০০ অক্ষরের মধ্যে লেখা পাঠান।"
        );
      }

      await bot.sendMessage(
        chatId,
        "🌐 ভাষা শনাক্ত করে অনুবাদ করা হচ্ছে..."
      );

      const result = await translateText(text, s.language);
      const target = s.language;

      s.mode = "menu";
      s.language = null;

      return sendRichText(
        chatId,
        `🌐 অনুবাদের ফলাফল\n\nমূল লেখা:\n${text}\n\nঅনুবাদ:\n${result}`,
        { reply_markup: mainMenu },
        target
      );
    }

    // NUMBER CONVERTER
    if (s.mode === "numbers") {
      s.mode = "menu";

      return sendRichText(
        chatId,
        `🔢 বাংলা সংখ্যা: ${convertDigits(text, true)}\n` +
        `🔢 ইংরেজি সংখ্যা: ${convertDigits(text, false)}`,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    // CALCULATOR
    if (s.mode === "calculator") {
      const result = calculate(text);

      return sendRichText(
        chatId,
        `🧮 হিসাব: ${result.expression}\n\n✅ উত্তর: ${result.answer}`,
        { reply_markup: mainMenu },
        "bn"
      );
    }

    return bot.sendMessage(
      chatId,
      "নিচের মেনু থেকে একটি ফিচার নির্বাচন করুন।",
      { reply_markup: mainMenu }
    );

  } catch (error) {
    console.error("Message error:", error);

    return bot.sendMessage(
      chatId,
      "❌ সমস্যা হয়েছে:\n" + error.message,
      { reply_markup: mainMenu }
    );
  }
});

// ==================================
// ERROR HANDLING
// ==================================

bot.on("polling_error", error => {
  console.error("Telegram polling error:", error.message);
});

console.log("🌟 Bangla Smart Tools started!");
