const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const math = require("mathjs");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) throw new Error("BOT_TOKEN missing");

const bot = new TelegramBot(TOKEN, { polling: true });
const sessions = new Map();

const languages = [
  ["🇧🇩","বাংলা","bn"],
  ["🇺🇸","ইংরেজি","en"],
  ["🇸🇦","আরবি","ar"],
  ["🇮🇳","হিন্দি","hi"],
  ["🇵🇰","উর্দু","ur"],
  ["🇫🇷","ফরাসি","fr"],
  ["🇩🇪","জার্মান","de"],
  ["🇪🇸","স্প্যানিশ","es"],
  ["🇨🇳","চীনা","zh-CN"],
  ["🇯🇵","জাপানি","ja"],
  ["🇰🇷","কোরিয়ান","ko"],
  ["🇷🇺","রুশ","ru"],
  ["🇮🇹","ইতালিয়ান","it"],
  ["🇵🇹","পর্তুগিজ","pt"],
  ["🇹🇷","তুর্কি","tr"],
  ["🇮🇩","ইন্দোনেশিয়ান","id"],
  ["🇲🇾","মালয়","ms"],
  ["🇹🇭","থাই","th"],
  ["🇻🇳","ভিয়েতনামি","vi"],
  ["🇳🇵","নেপালি","ne"],
  ["🇱🇰","সিংহলি","si"],
  ["🇮🇷","ফারসি","fa"],
  ["🇳🇱","ডাচ","nl"],
  ["🇬🇷","গ্রিক","el"],
  ["🇵🇱","পোলিশ","pl"],
  ["🇸🇪","সুইডিশ","sv"],
  ["🇳🇴","নরওয়েজিয়ান","no"],
  ["🇩🇰","ড্যানিশ","da"],
  ["🇫🇮","ফিনিশ","fi"],
  ["🇮🇱","হিব্রু","he"],
  ["🇺🇦","ইউক্রেনীয়","uk"],
  ["🇷🇴","রোমানিয়ান","ro"],
  ["🇨🇿","চেক","cs"],
  ["🇭🇺","হাঙ্গেরিয়ান","hu"],
  ["🇮🇪","আইরিশ","ga"],
  ["🇰🇭","খমের","km"],
  ["🇱🇦","লাও","lo"],
  ["🇲🇲","বার্মিজ","my"],
  ["🇵🇭","ফিলিপিনো","tl"],
  ["🇿🇦","আফ্রিকান্স","af"]
];

function mainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {text:"🧮 Advanced Calculator",callback_data:"calculator"},
          {text:"🌐 Translator",callback_data:"translator"}
        ],
        [
          {text:"✍️ Post Maker",callback_data:"post"},
          {text:"ℹ️ About",callback_data:"about"}
        ]
      ]
    }
  };
}

function languageMenu() {
  const rows = [];

  for (let i = 0; i < languages.length; i += 2) {
    rows.push([
      {
        text: languages[i][0] + " " + languages[i][1],
        callback_data: "lang_" + languages[i][2]
      },
      ...(languages[i+1] ? [{
        text: languages[i+1][0] + " " + languages[i+1][1],
        callback_data: "lang_" + languages[i+1][2]
      }] : [])
    ]);
  }

  rows.push([{text:"🏠 Main Menu",callback_data:"home"}]);

  return {reply_markup:{inline_keyboard:rows}};
}

function calculatorMenu() {
  const buttons = [
    ["7","8","9","÷"],
    ["4","5","6","×"],
    ["1","2","3","−"],
    ["0",".","%","+"],
    ["√","x²","x³","^"],
    ["sin","cos","tan","log"],
    ["(",")","π","!"],
    ["C","⌫","=","🏠"]
  ];

  return {
    reply_markup:{
      inline_keyboard:buttons.map(row =>
        row.map(value => ({
          text:value,
          callback_data:"calc_" + value
        }))
      )
    }
  };
}

function normalize(text) {
  const digits = {
    "০":"0","১":"1","২":"2","৩":"3","৪":"4",
    "৫":"5","৬":"6","৭":"7","৮":"8","৯":"9"
  };

  return text
    .replace(/[০-৯]/g,d=>digits[d])
    .replace(/×/g,"*")
    .replace(/÷/g,"/")
    .replace(/−/g,"-")
    .replace(/π/g,"pi")
    .replace(/²/g,"^2")
    .replace(/³/g,"^3")
    .replace(/√/g,"sqrt")
    .replace(/sin|cos|tan|log|sqrt|pi|abs|round/gi,
      value=>value.toLowerCase())
    .trim();
}

function calculate(expression) {
  const allowed = /^[0-9+\-*/().%^!a-zA-Z_\s]+$/;

  if (!allowed.test(expression)) {
    throw new Error("Invalid expression");
  }

  const node = math.parse(expression);

  const allowedFunctions = [
    "sqrt","sin","cos","tan","log","log10",
    "abs","round","floor","ceil","exp"
  ];

  node.traverse(child => {
    if (child.isSymbolNode &&
        !["pi","e"].includes(child.name) &&
        !allowedFunctions.includes(child.name)) {
      throw new Error("Invalid symbol");
    }

    if (child.isFunctionNode &&
        !allowedFunctions.includes(child.fn.name)) {
      throw new Error("Invalid function");
    }

    if (child.isAssignmentNode ||
        child.isAccessorNode ||
        child.isFunctionAssignmentNode) {
      throw new Error("Invalid operation");
    }
  });

  const result = node.evaluate();

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Invalid result");
  }

  const steps = [];
  node.traverse(child => {
    if (child.isOperatorNode || child.isFunctionNode) {
      try {
        steps.push(
          child.toString() + " = " +
          math.format(child.evaluate(), {precision:10})
        );
      } catch {}
    }
  });

  return {
    result:math.format(result,{precision:12}),
    steps:[...new Set(steps)].slice(0,10)
  };
}

async function translate(text, target) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text) +
    "&langpair=" +
    encodeURIComponent("bn|" + target);

  const response = await fetch(url);
  if (!response.ok) throw new Error("Translation service error");

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error("Translation unavailable");
  }

  return data.responseData.translatedText;
}

bot.onText(/\/start/, msg => {
  sessions.delete(msg.chat.id);
  bot.sendMessage(
    msg.chat.id,
    "✨ স্বাগতম Bangla Smart Tools-এ!\nআপনার প্রয়োজনীয় টুল নির্বাচন করুন।",
    mainMenu()
  );
});

bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  if (data === "home") {
    sessions.delete(chatId);
    return bot.sendMessage(chatId,"🏠 Main Menu",mainMenu());
  }

  if (data === "calculator") {
    sessions.set(chatId,{mode:"calculator",expression:""});
    return bot.sendMessage(
      chatId,
      "🧮 Advanced Calculator\n\nহিসাবের চিহ্নগুলো ব্যবহার করুন।",
      calculatorMenu()
    );
  }

  if (data === "translator") {
    sessions.set(chatId,{mode:"translator"});
    return bot.sendMessage(
      chatId,
      "🌐 কোন ভাষায় অনুবাদ করতে চান?\n\nনিচ থেকে ভাষা নির্বাচন করুন।",
      languageMenu()
    );
  }

  if (data === "post") {
    sessions.set(chatId,{mode:"post"});
    return bot.sendMessage(
      chatId,
      "✍️ পোস্টের বিষয় লিখে পাঠান।"
    );
  }

  if (data === "about") {
    return bot.sendMessage(
      chatId,
      "Bangla Smart Tools\n\nআপনার দৈনন্দিন ডিজিটাল সহকারী।",
      mainMenu()
    );
  }

  if (data.startsWith("lang_")) {
    const code = data.replace("lang_","");
    const lang = languages.find(item=>item[2]===code);

    sessions.set(chatId,{
      mode:"translate",
      target:code,
      language:lang[1]
    });

    return bot.sendMessage(
      chatId,
      "🌐 নির্বাচিত ভাষা: " + lang[0] + " " + lang[1] +
      "\n\nএখন বাংলা লেখা পাঠান।"
    );
  }

  if (data.startsWith("calc_")) {
    const session = sessions.get(chatId);
    if (!session || session.mode !== "calculator") return;

    const value = data.replace("calc_","");

    if (value === "🏠") {
      sessions.delete(chatId);
      return bot.sendMessage(chatId,"Main Menu",mainMenu());
    }

    if (value === "C") {
      session.expression = "";
    } else if (value === "⌫") {
      session.expression = session.expression.slice(0,-1);
    } else if (value === "=") {
      try {
        const result = calculate(normalize(session.expression));
        return bot.sendMessage(
          chatId,
          "🧮 হিসাব: " + session.expression +
          "\n\n📖 ধাপ:\n" +
          (result.steps.length
            ? result.steps.join("\n")
            : "প্রদত্ত সংখ্যার মান নির্ণয় করা হয়েছে।") +
          "\n\n✅ উত্তর: " + result.result,
          calculatorMenu()
        );
      } catch {
        return bot.sendMessage(chatId,"❌ সঠিক হিসাব দিন।",calculatorMenu());
      }
    } else {
      const symbols = {
        "÷":"/","×":"*","−":"-",
        "x²":"^2","x³":"^3","√":"sqrt("
      };
      session.expression += symbols[value] || value;
    }

    return bot.sendMessage(
      chatId,
      "🧮 হিসাব:\n" + (session.expression || "0"),
      calculatorMenu()
    );
  }
});

bot.on("message", async msg => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const session = sessions.get(chatId);

  if (!session) return;

  if (session.mode === "translate") {
    if (text.length > 450) {
      return bot.sendMessage(chatId,"অনুগ্রহ করে ৪৫০ অক্ষরের মধ্যে লিখুন।");
    }

    await bot.sendMessage(chatId,"⏳ অনুবাদ করা হচ্ছে...");

    try {
      const result = await translate(text,session.target);
      return bot.sendMessage(
        chatId,
        "🌐 " + session.language + " অনুবাদ:\n\n" + result,
        mainMenu()
      );
    } catch {
      return bot.sendMessage(
        chatId,
        "অনুবাদ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।"
      );
    }
  }

  if (session.mode === "post") {
    sessions.delete(chatId);

    const captions = [
      "✨ " + text +
      "\n\nনিজের স্বপ্ন পূরণের পথে এগিয়ে চলুন। ❤️\n\n#BanglaPost #Life",

      "🌸 " + text +
      "\n\nপ্রতিটি দিন নতুন সম্ভাবনা নিয়ে আসে।\n\n#BanglaCaption #Motivation",

      "💚 " + text +
      "\n\nনিজের গল্প নিজেই সুন্দর করে লিখুন।\n\n#BanglaStatus #Love"
    ];

    return bot.sendMessage(
      chatId,
      captions[Math.floor(Math.random()*captions.length)],
      mainMenu()
    );
  }
});

app.get("/",(req,res)=>{
  res.send("Bangla Smart Tools is running!");
});

app.get("/health",(req,res)=>{
  res.json({status:"ok"});
});

app.listen(PORT,()=>{
  console.log("Server running on "+PORT);
});

bot.on("polling_error",error=>{
  console.error("Telegram error:",error.message);
});
