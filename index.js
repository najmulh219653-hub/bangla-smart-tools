const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { evaluate } = require("mathjs");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  throw new Error("BOT_TOKEN environment variable is missing");
}

const bot = new TelegramBot(TOKEN, { polling: true });

const menu = {
  reply_markup: {
    keyboard: [
      ["🌐 অনুবাদ", "✍️ পোস্ট ও ক্যাপশন"],
      ["🧮 ক্যালকুলেটর", "🏠 মেইন মেনু"]
    ],
    resize_keyboard: true
  }
};

const sessions = new Map();

const translations = {
  "hello": "হ্যালো",
  "good morning": "সুপ্রভাত",
  "good night": "শুভ রাত্রি",
  "thank you": "ধন্যবাদ",
  "how are you": "আপনি কেমন আছেন?",
  "love": "ভালোবাসা",
  "friend": "বন্ধু",
  "বাংলাদেশ": "Bangladesh",
  "ধন্যবাদ": "Thank you",
  "ভালোবাসা": "Love",
  "বন্ধু": "Friend",
  "সুপ্রভাত": "Good morning"
};

function mainMenu(chatId) {
  sessions.delete(chatId);
  bot.sendMessage(
    chatId,
    "🤖 স্বাগতম Bangla Smart Tools-এ!\n\nআপনার প্রয়োজনীয় টুল নির্বাচন করুন।",
    menu
  );
}

bot.onText(/\/start/, (msg) => {
  mainMenu(msg.chat.id);
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text === "🏠 মেইন মেনু") {
    return mainMenu(chatId);
  }

  if (text === "🌐 অনুবাদ") {
    sessions.set(chatId, "translate");
    return bot.sendMessage(
      chatId,
      "🌐 বাংলা অথবা ইংরেজি লেখা পাঠান।\n\nপ্রাথমিক সংস্করণে সীমিত শব্দভান্ডার ব্যবহার করা হচ্ছে।",
      menu
    );
  }

  if (text === "✍️ পোস্ট ও ক্যাপশন") {
    sessions.set(chatId, "caption");
    return bot.sendMessage(
      chatId,
      "✍️ কোন বিষয়ে পোস্ট বা ক্যাপশন চান?\n\nবিষয়টি লিখে পাঠান।",
      menu
    );
  }

  if (text === "🧮 ক্যালকুলেটর") {
    sessions.set(chatId, "calculator");
    return bot.sendMessage(
      chatId,
      "🧮 আপনার হিসাব লিখুন।\n\nউদাহরণ: 250+350*2",
      menu
    );
  }

  const mode = sessions.get(chatId);

  if (!mode) {
    return bot.sendMessage(
      chatId,
      "নিচের মেনু থেকে একটি টুল নির্বাচন করুন।",
      menu
    );
  }

  if (mode === "translate") {
    const result = translations[text.toLowerCase()] || translations[text];

    if (!result) {
      return bot.sendMessage(
        chatId,
        "দুঃখিত! এই শব্দ বা বাক্যটি এখনো আমার সীমিত অনুবাদ তালিকায় নেই।",
        menu
      );
    }

    return bot.sendMessage(chatId, "🌐 অনুবাদ:\n\n" + result, menu);
  }

  if (mode === "caption") {
    const templates = [
      `✨ ${text}\n\nজীবনের প্রতিটি মুহূর্তই নতুন কিছু শেখায়। নিজের স্বপ্নের পথে এগিয়ে চলুন। ❤️\n\n#BanglaCaption #Life`,
      `💚 ${text}\n\nহাসুন, ভালো থাকুন এবং নিজের গল্প নিজেই লিখুন।\n\n#BanglaPost #Motivation`,
      `🌸 ${text}\n\nকথার চেয়ে কাজের মাধ্যমে নিজের পরিচয় তৈরি করুন।\n\n#বাংলা_ক্যাপশন #জীবন`
    ];

    const result = templates[
      Math.floor(Math.random() * templates.length)
    ];

    sessions.delete(chatId);
    return bot.sendMessage(chatId, result, menu);
  }

  if (mode === "calculator") {
    try {
      if (!/^[0-9+\-*/().%\s]+$/.test(text)) {
        throw new Error("Invalid expression");
      }

      const result = evaluate(text);

      if (typeof result !== "number" || !Number.isFinite(result)) {
        throw new Error("Invalid result");
      }

      return bot.sendMessage(
        chatId,
        `🧮 আপনার হিসাব:\n${text} = ${result}`,
        menu
      );
    } catch {
      return bot.sendMessage(
        chatId,
        "❌ সঠিক হিসাব লিখুন। যেমন: 100+50*2",
        menu
      );
    }
  }
});

app.get("/", (req, res) => {
  res.send("Bangla Smart Tools Bot is running!");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

bot.on("polling_error", (error) => {
  console.error("Telegram polling error:", error.message);
});
