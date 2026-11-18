import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { create, all } from "mathjs";

const app = express();
const math = create(all);

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-4-hydrogen";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN missing!");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

app.get("/", (req, res) => {
  res.send("🌟 Bangla Smart Tools Bot is running!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    bot: "Bangla Smart Tools",
    ai: Boolean(ai)
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// ===============================
// USER SESSION
// ===============================

const sessions = new Map();

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

// ===============================
// MAIN MENU
// ===============================

const mainMenu = {
  keyboard: [
    ["✍️ AI অটো পোস্ট", "🎬 ভিডিও কনটেন্ট"],
    ["🧮 ক্যালকুলেটর", "🌐 অনুবাদ"],
    ["📱 সোশ্যাল ক্যাপশন", "🔢 সংখ্যা রূপান্তর"],
    ["📚 গণিতের সূত্র", "ℹ️ About"],
    ["🏠 মেইন মেনু"]
  ],
  resize_keyboard: true
};

function showHome(chatId, name = "বন্ধু") {
  const s = getSession(chatId);
  s.mode = "menu";
  s.platform = null;
  s.language = null;
  s.expression = "";

  return bot.sendMessage(
    chatId,
    `🌟 স্বাগতম ${name}!\n\n` +
    `🤖 BANGla SMART TOOLS\n` +
    `আপনার AI ডিজিটাল সহকারী।\n\n` +
    `✍️ AI দিয়ে পোস্ট তৈরি\n` +
    `🎬 ভিডিও টাইটেল ও বিবরণ\n` +
    `🧮 উন্নত ক্যালকুলেটর\n` +
    `🌐 বহু ভাষায় অনুবাদ\n` +
    `📱 সোশ্যাল মিডিয়া ক্যাপশন\n\n` +
    `নিচের মেনু থেকে একটি ফিচার নির্বাচন করুন।`,
    { reply_markup: mainMenu }
  );
}

// ===============================
// ABOUT
// ===============================

const ABOUT_TEXT =
  "🌟 ABOUT BANGla SMART TOOLS\n\n" +
  "Bangla Smart Tools একটি বহুমুখী ডিজিটাল সহকারী, " +
  "যার লক্ষ্য প্রয়োজনীয় স্মার্ট টুলসকে সহজে এক জায়গায় নিয়ে আসা।\n\n" +
  "✨ আমাদের সুবিধাসমূহ:\n\n" +
  "✍️ AI Auto Post Writer — Facebook, TikTok, YouTube, Instagram ও অন্যান্য প্ল্যাটফর্মের জন্য কনটেন্ট তৈরি।\n\n" +
  "🎬 Video Content — ভিডিওর টাইটেল, বিবরণ ও কনটেন্ট আইডিয়া।\n\n" +
  "🧮 Smart Calculator — সাধারণ ও উন্নত গাণিতিক হিসাব।\n\n" +
  "🌐 Translator — বাংলা থেকে বিভিন্ন ভাষায় অনুবাদ।\n\n" +
  "🔢 Number Converter — বাংলা ও ইংরেজি সংখ্যা রূপান্তর।\n\n" +
  "📚 Math Formulas — প্রয়োজনীয় গণিতের সূত্র।\n\n" +
  "🎯 আমাদের উদ্দেশ্য: প্রযুক্তিকে সহজ, কার্যকর ও সবার ব্যবহার উপযোগী করা।\n\n" +
  "ধন্যবাদ Bangla Smart Tools ব্যবহার করার জন্য। ❤️";

// ===============================
// GEMINI INTERACTIONS API
// ===============================

async function askAI(prompt) {
  if (!ai) {
    throw new Error(
      "Gemini API Key সেট করা হয়নি। Render Environment-এ GEMINI_API_KEY যোগ করুন।"
    );
  }

  const result = await ai.interactions.create({
    model: MODEL,
    input: prompt
  });

  const answer = result.output_text;

  if (!answer) {
    throw new Error("AI থেকে কোনো লেখা পাওয়া যায়নি।");
  }

  return answer;
}

// ===============================
// AI POST WRITER
// ===============================

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
    { text: "🏠 মেইন মেনু", callback_data: "home" }
  ]);

  return { inline_keyboard: rows };
}

function startPost(chatId) {
  const s = getSession(chatId);
  s.mode = "choose_platform";
  s.platform = null;

  return bot.sendMessage(
    chatId,
    "✍️ AI AUTO POST STUDIO\n\n" +
    "কোন প্ল্যাটফর্মের জন্য কনটেন্ট চান?\n\n" +
    "নিচের আইকনে চাপ দিন:",
    { reply_markup: platformKeyboard() }
  );
}

async function generatePost(topic, platform) {
  let instructions = "";

  if (platform === "facebook") {
    instructions =
      "একটি আকর্ষণীয় Facebook পোস্ট, শিরোনাম, মূল লেখা, CTA এবং হ্যাশট্যাগ দিন।";
  } else if (platform === "tiktok") {
    instructions =
      "TikTok-এর জন্য Hook, সংক্ষিপ্ত ক্যাপশন, ভিডিও আইডিয়া ও হ্যাশট্যাগ দিন।";
  } else if (platform === "youtube") {
    instructions =
      "YouTube-এর জন্য ৩টি Title, Description, Hashtags এবং Tags দিন।";
  } else if (platform === "instagram") {
    instructions =
      "Instagram-এর জন্য আকর্ষণীয় Caption, Emoji ও Hashtags দিন।";
  } else if (platform === "telegram") {
    instructions =
      "Telegram চ্যানেলের জন্য সুন্দর শিরোনাম, পোস্ট ও হ্যাশট্যাগ দিন।";
  } else if (platform === "x") {
    instructions =
      "X-এর জন্য সংক্ষিপ্ত, আকর্ষণীয় পোস্ট লিখুন।";
  } else if (platform === "linkedin") {
    instructions =
      "LinkedIn-এর জন্য পেশাদার ও তথ্যবহুল পোস্ট লিখুন।";
  } else {
    instructions =
      "Facebook, TikTok, YouTube, Instagram, Telegram, X এবং LinkedIn-এর জন্য আলাদা আলাদা কনটেন্ট তৈরি করুন। প্রতিটির শিরোনাম স্পষ্ট রাখুন।";
  }

  const prompt = `
আপনি একজন দক্ষ বাংলা ও ইংরেজি কনটেন্ট রাইটার।

বিষয়: ${topic}
প্ল্যাটফর্ম: ${platformNames[platform]}

কাজ:
${instructions}

নিয়ম:
- সুন্দর ও শুদ্ধ বাংলা লিখুন।
- ব্যবহারকারী ইংরেজি চাইলে ইংরেজিতে লিখুন।
- প্রাসঙ্গিক ইমোজি ব্যবহার করুন।
- প্রাসঙ্গিক হ্যাশট্যাগ দিন।
- মিথ্যা তথ্য বা ভুয়া দাবি তৈরি করবেন না।
- কপি করার উপযোগী সম্পূর্ণ লেখা দিন।
- অপ্রয়োজনীয় ব্যাখ্যা বাদ দিন।
`;

  return askAI(prompt);
}

// ===============================
// VIDEO CONTENT
// ===============================

async function generateVideo(topic) {
  const prompt = `
আপনি একজন YouTube ও Short Video Content Expert।

ভিডিওর বিষয়: ${topic}

বাংলায় তৈরি করুন:
1. পাঁচটি আকর্ষণীয় ভিডিও Title
2. একটি SEO-friendly Description
3. প্রাসঙ্গিক Hashtags
4. YouTube Tags
5. Thumbnail-এ লেখার জন্য তিনটি ছোট বাক্য
6. ভিডিওর সংক্ষিপ্ত Outline

কোনো মিথ্যা দাবি বা বানানো তথ্য দেবেন না।
`;

  return askAI(prompt);
}

// ===============================
// CALCULATOR
// ===============================

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
      if (!allowedFunctions.has(node.fn.name)) {
        throw new Error("ফাংশন অনুমোদিত নয়।");
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
    "নিচের বাটন ব্যবহার করুন:",
    { reply_markup: calcKeyboard() }
  );
}

// ===============================
// TRANSLATOR
// ===============================

const languages = [
  ["🇬🇧 English", "en"],
  ["🇮🇳 Hindi", "hi"],
  ["🇸🇦 Arabic", "ar"],
  ["🇵🇰 Urdu", "ur"],
  ["🇫🇷 French", "fr"],
  ["🇩🇪 German", "de"],
  ["🇪🇸 Spanish", "es"],
  ["🇮🇹 Italian", "it"],
  ["🇵🇹 Portuguese", "pt"],
  ["🇷🇺 Russian", "ru"],
  ["🇨🇳 Chinese", "zh-CN"],
  ["🇯🇵 Japanese", "ja"],
  ["🇰🇷 Korean", "ko"],
  ["🇹🇷 Turkish", "tr"],
  ["🇮🇷 Persian", "fa"],
  ["🇳🇵 Nepali", "ne"],
  ["🇱🇰 Sinhala", "si"],
  ["🇮🇩 Indonesian", "id"],
  ["🇲🇾 Malay", "ms"],
  ["🇹🇭 Thai", "th"],
  ["🇻🇳 Vietnamese", "vi"],
  ["🇳🇱 Dutch", "nl"],
  ["🇵🇱 Polish", "pl"],
  ["🇺🇦 Ukrainian", "uk"],
  ["🇬🇷 Greek", "el"],
  ["🇸🇪 Swedish", "sv"],
  ["🇳🇴 Norwegian", "no"],
  ["🇩🇰 Danish", "da"],
  ["🇫🇮 Finnish", "fi"],
  ["🇮🇱 Hebrew", "he"],
  ["🇧🇬 Bulgarian", "bg"],
  ["🇨🇿 Czech", "cs"],
  ["🇷🇴 Romanian", "ro"],
  ["🇭🇺 Hungarian", "hu"],
  ["🇮🇪 Irish", "ga"],
  ["🇰🇪 Swahili", "sw"],
  ["🇿🇦 Afrikaans", "af"],
  ["🇧🇩 Bengali", "bn"],
  ["🇦🇱 Albanian", "sq"],
  ["🇧🇷 Brazilian Portuguese", "pt-BR"]
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

  const navigation = [];

  if (page > 0) {
    navigation.push({
      text: "⬅️ আগের",
      callback_data: "langpage:" + (page - 1)
    });
  }

  if ((page + 1) * 10 < languages.length) {
    navigation.push({
      text: "পরের ➡️",
      callback_data: "langpage:" + (page + 1)
    });
  }

  if (navigation.length) rows.push(navigation);

  rows.push([
    { text: "🏠 মেইন মেনু", callback_data: "home" }
  ]);

  return { inline_keyboard: rows };
}

async function translateText(text, target) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text.slice(0, 450)) +
    "&langpair=bn|" + encodeURIComponent(target);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || !data.responseData?.translatedText) {
    throw new Error("অনুবাদ পাওয়া যায়নি।");
  }

  return data.responseData.translatedText;
}

function showLanguages(chatId) {
  const s = getSession(chatId);
  s.mode = "translation";
  s.language = null;

  return bot.sendMessage(
    chatId,
    "🌐 বাংলা থেকে কোন ভাষায় অনুবাদ করবেন?",
    { reply_markup: languageKeyboard(0) }
  );
}

// ===============================
// NUMBER CONVERTER
// ===============================

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

// ===============================
// MATH FORMULAS
// ===============================

const formulas =
  "📚 গণিতের প্রয়োজনীয় সূত্র\n\n" +
  "বর্গক্ষেত্র = বাহু × বাহু\n" +
  "আয়তক্ষেত্র = দৈর্ঘ্য × প্রস্থ\n" +
  "ত্রিভুজ = ½ × ভূমি × উচ্চতা\n" +
  "বৃত্ত = π × r²\n" +
  "বৃত্তের পরিধি = 2πr\n\n" +
  "(a+b)² = a² + 2ab + b²\n" +
  "(a-b)² = a² - 2ab + b²\n" +
  "a²-b² = (a-b)(a+b)";

// ===============================
// CALLBACK HANDLER
// ===============================

bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const s = getSession(chatId);
  const data = query.data;

  await bot.answerCallbackQuery(query.id).catch(() => {});

  try {
    if (data === "home") {
      return showHome(chatId, query.from.first_name);
    }

    if (data.startsWith("platform:")) {
      s.platform = data.split(":")[1];
      s.mode = "post_topic";

      return bot.sendMessage(
        chatId,
        "✍️ কোন বিষয়ে পোস্ট লিখব?\n\n" +
        "উদাহরণ: বাংলাদেশের প্রাকৃতিক সৌন্দর্য"
      );
    }

    if (data.startsWith("langpage:")) {
      const page = Number(data.split(":")[1]) || 0;

      return bot.editMessageReplyMarkup(languageKeyboard(page), {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    }

    if (data.startsWith("lang:")) {
      s.language = data.split(":")[1];
      s.mode = "translation";

      return bot.sendMessage(chatId, "✍️ এখন বাংলা লেখাটি পাঠান।");
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

        return bot.sendMessage(
          chatId,
          `🧮 হিসাব: ${result.expression}\n\n` +
          `✅ উত্তর: ${result.answer}`,
          { reply_markup: calcKeyboard() }
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
    return bot.sendMessage(chatId, "❌ " + error.message);
  }
});

// ===============================
// MESSAGE HANDLER
// ===============================

bot.onText(/\/start/, msg => {
  showHome(msg.chat.id, msg.from.first_name);
});

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
      return bot.sendMessage(chatId, "🎬 ভিডিওর বিষয় লিখে পাঠান।");
    }

    if (text === "🧮 ক্যালকুলেটর") {
      return showCalculator(chatId);
    }

    if (text === "🌐 অনুবাদ") {
      return showLanguages(chatId);
    }

    if (text === "📱 সোশ্যাল ক্যাপশন") {
      s.mode = "social_topic";
      return bot.sendMessage(chatId, "📱 ক্যাপশনের বিষয় লিখুন।");
    }

    if (text === "🔢 সংখ্যা রূপান্তর") {
      s.mode = "numbers";
      return bot.sendMessage(chatId, "বাংলা অথবা ইংরেজি সংখ্যা পাঠান।");
    }

    if (text === "📚 গণিতের সূত্র") {
      return bot.sendMessage(chatId, formulas, {
        reply_markup: mainMenu
      });
    }

    if (text === "ℹ️ About") {
      return bot.sendMessage(chatId, ABOUT_TEXT, {
        reply_markup: mainMenu
      });
    }

    if (s.mode === "post_topic") {
      if (text.length > 1000) {
        return bot.sendMessage(chatId, "বিষয়টি ১০০০ অক্ষরের মধ্যে লিখুন।");
      }

      await bot.sendMessage(chatId, "⏳ AI পোস্ট তৈরি করছে...");
      const result = await generatePost(text, s.platform);
      s.mode = "menu";
      s.platform = null;

      return bot.sendMessage(chatId, result, {
        reply_markup: mainMenu
      });
    }

    if (s.mode === "video_topic") {
      await bot.sendMessage(chatId, "⏳ ভিডিও কনটেন্ট তৈরি হচ্ছে...");
      const result = await generateVideo(text);
      s.mode = "menu";

      return bot.sendMessage(chatId, result, {
        reply_markup: mainMenu
      });
    }

    if (s.mode === "social_topic") {
      await bot.sendMessage(chatId, "⏳ ক্যাপশন তৈরি হচ্ছে...");
      const result = await generatePost(
        text,
        "instagram"
      );
      s.mode = "menu";

      return bot.sendMessage(chatId, result, {
        reply_markup: mainMenu
      });
    }

    if (s.mode === "translation" && s.language) {
      if (text.length > 450) {
        return bot.sendMessage(chatId, "৪৫০ অক্ষরের মধ্যে লেখা পাঠান।");
      }

      const result = await translateText(text, s.language);
      s.mode = "menu";
      s.language = null;

      return bot.sendMessage(
        chatId,
        `🌐 অনুবাদ\n\nমূল লেখা:\n${text}\n\nঅনুবাদ:\n${result}`,
        { reply_markup: mainMenu }
      );
    }

    if (s.mode === "numbers") {
      s.mode = "menu";

      return bot.sendMessage(
        chatId,
        `🔢 বাংলা সংখ্যা: ${convertDigits(text, true)}\n` +
        `🔢 ইংরেজি সংখ্যা: ${convertDigits(text, false)}`,
        { reply_markup: mainMenu }
      );
    }

    if (s.mode === "calculator") {
      const result = calculate(text);

      return bot.sendMessage(
        chatId,
        `🧮 হিসাব: ${result.expression}\n\n` +
        `✅ উত্তর: ${result.answer}`,
        { reply_markup: calcKeyboard() }
      );
    }

    return bot.sendMessage(
      chatId,
      "নিচের মেনু থেকে একটি ফিচার নির্বাচন করুন।",
      { reply_markup: mainMenu }
    );

  } catch (error) {
    console.error("Message error:", error.message);

    return bot.sendMessage(
      chatId,
      "❌ সমস্যা হয়েছে:\n" + error.message,
      { reply_markup: mainMenu }
    );
  }
});

// ===============================
// ERROR HANDLING
// ===============================

bot.on("polling_error", error => {
  console.error("Telegram polling error:", error.message);
});

console.log("🌟 Bangla Smart Tools started!");
