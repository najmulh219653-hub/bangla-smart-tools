const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// মিডলওয়্যার
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// জেমিনি এআই ইনিশিয়ালাইজ (API Key রেন্ডারের Environment Variable থেকে আসবে)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ১. হেলথ চেক রাউট (Uptime Robot-এর জন্য)
app.get('/ping', (req, res) => {
    res.status(200).send('Bangla Smart Tools Server is Active!');
});

// ২. এআই প্রসেসিং রাউট (সব এআই টুলের জন্য)
app.post('/api/ai', async (req, res) => {
    try {
        const { tool, prompt, extra } = req.body;
        let systemInstruction = "";

        // টুল অনুযায়ী এআই-কে নির্দেশনা দেওয়া
        if (tool === 'chat') {
            systemInstruction = "তুমি Bangla Smart Tools-এর একজন স্মার্ট ও বন্ধুভাবাপন্ন বাংলা এআই সহকারী।";
        } else if (tool === 'translate') {
            systemInstruction = `নিচের লেখাটি নিখুঁতভাবে ${extra || 'ইংরেজি'} ভাষায় অনুবাদ করো এবং শুধু অনুবাদটি দাও:`;
        } else if (tool === 'content') {
            systemInstruction = `সোশ্যাল মিডিয়ার (${extra || 'Facebook/TikTok'}) জন্য আকর্ষণীয় ক্যাপশন, হ্যাশট্যাগ এবং আইডিয়া তৈরি করে দাও:`;
        } else if (tool === 'language') {
            systemInstruction = `তুমি একজন ভাষা শিক্ষক। ইউজার যে ভাষা (${extra || 'ইংরেজি'}) শিখতে চায়, তার গুরুত্বপূর্ণ শব্দার্থ, দৈনন্দিন বাক্য এবং বাংলা উচ্চারণ সহজভাবে শিখিয়ে দাও।`;
        } else if (tool === 'image_prompt') {
            systemInstruction = "ইউজার যে ছবির বর্ণনা দিয়েছে, তার জন্য একটি হাই-কোয়ালিটি এআই ইমেজ জেনারেশন প্রম্পট (ইংরেজিতে) তৈরি করে দাও এবং বাংলায় বুঝিয়ে বলো।";
        }

        const fullPrompt = `${systemInstruction}\n\nইউজারের ইনপুট: ${prompt}`;

        // সঠিক ও ফাস্ট জেমিনি মডেল ব্যবহার
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "দুঃখিত, সার্ভারে সাময়িক সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
    }
});

// মেইন পেজ লোড করা
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
