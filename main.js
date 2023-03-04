const http = require("http");
const crypto = require("crypto");
const { Client, Events, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.TOKEN);

const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", chunk => {
        body += chunk;
    });
    req.on("end", async () => {
        const signature = req.headers["x-hub-signature-256"];
        const event = req.headers["x-github-event"];
        const channel = client.channels.cache.get(process.env.CHANNEL_ID);

        if (event != "push") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("Event not supported");
        }
        if (!signature) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("No signature found in the request");
        }

        if (!body) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("Invalid request");
        }
        const { repository, pusher, compare, head_commit } = JSON.parse(body);

        if (!repository || !pusher || !compare || !head_commit) {
            res.writeHead(200, { "Content-Type": "text/plain" });
            return res.end("Invalid request");
        }
        let diff_raw_text = (await axios(compare + ".diff")).data;
        let formattedDate = new Date(head_commit.timestamp).toLocaleString("ro-RO", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZone: "Europe/Bucharest",
        });

        let final_message =
            "```js\n" +
            `// push in ${repository.name} //\n` +
            `pusher: '${pusher.name + (pusher.name != head_commit.author.name ? ` (aka. ${head_commit.author.name})` : "")}' \n` +
            `message: '${head_commit.message}'\n` +
            `date: '${formattedDate}'\n` +
            `added: [${head_commit.added.map(e => `'${e}'`).join(", ")}]\n` +
            `removed:[${head_commit.removed.map(e => `'${e}'`).join(", ")}]\n` +
            `modified: [${head_commit.modified.map(e => `'${e}'`).join(", ")}]\n` +
            `url: '${head_commit.url}'` +
            "\n\n";

        if (final_message.length + diff_raw_text.length > 2000) {
            final_message += "diff\n" + "too much code has been edited, it doesn't fit here :(" + "```";
        } else {
            final_message += "diff\n" + diff_raw_text + "```";
        }

        if (channel) {
            channel.send(final_message);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Message sent to Discord server");
        } else {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Error: could not find channel");
        }
    });
});

server.listen(8000, "0.0.0.0", () => {
    console.log("Server is listening on port 8000");
    client.on("ready", () => {
        console.log("Logged in to Discord server");
    });
});
