const makeWASocket = require("@whiskeysockets/baileys").default;
const { useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { default: axios } = require("axios");
const fs = require("fs");
const config = require("./config.json");

async function startBot() {
    const { state, saveState } = useSingleFileAuthState("./auth_info.json");
    const sock = makeWASocket({ auth: state });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const sender = msg.key.remoteJid;

        if (text) {
            const response = await getAIReply(text);
            await sock.sendMessage(sender, { text: response });
        }
    });

    sock.ev.on("creds.update", saveState);
}

async function getAIReply(message) {
    const prompt = config.default_prompt + "\nUser: " + message + "\nBot:";
    const res = await axios.post("https://api.openai.com/v1/completions", {
        model: "text-davinci-003",
        prompt,
        max_tokens: 100,
    }, {
        headers: {
            Authorization: `Bearer ${config.openai_api_key}`,
            "Content-Type": "application/json",
        },
    });

    return res.data.choices[0].text.trim();
}

startBot();
