const http = require("http");
const crypto = require("crypto");
const { Client, Events, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const channel = client.channels.cache.get(process.env.CHANNEL_ID);
const secret = process.env.WEBHOOK_SECRET;

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
        const signature = req.headers["X-Hub-Signature"];
        const event = req.headers["X-Github-Event"];

        if (event != "push") {
            res.statusCode(401);
            return res.end("Event not supported");
        }
        if (!signature) {
            res.statusCode(401);
            return res.end("No signature found in the request");
        }

        const sha1 = crypto.createHmac("sha1", secret);
        const payload = JSON.stringify(req.body);
        const computedSignature = "sha1=" + sha1.update(payload).digest("hex");

        if (computedSignature !== signature) return res.end("Invalid signature");

        const { repository, pusher, compare, head_commit } = JSON.parse(body);

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

        const final_message =
            "```js\n" +
            `// push in ${repository.name} //\n` +
            `pusher: '${pusher.name + (pusher.name != head_commit.author.name ? ` (aka. ${head_commit.author.name})` : "")}' \n` +
            `message: '${head_commit.message}'\n` +
            `date: '${formattedDate}'\n` +
            `added: [ '${head_commit.added.join("', '")}' ]\n` +
            `removed:[ '${head_commit.removed.join("', '")}' ]` +
            `modified: [ '${head_commit.modified.join("', '")}' ]\n` +
            `url: '${head_commit.url}'` +
            "```";

        if (final_message.length + diff_raw_text > 2000) {
            final_message += "```diff\n" + "too much code has been edited, it doesn't fit here :(" + "```";
        } else {
            final_message += "```diff\n" + diff_raw_text + "```";
        }

        if (channel) {
            channel.send(final_message);
            res.statusCode(200);
            res.end("Message sent to Discord server");
        } else {
            res.statusCode(404);
            res.end("Error: could not find channel");
        }
    });
});

client.on("ready", () => {
    console.log("Logged in to Discord server");
    server.listen(8000, "0.0.0.0", () => {
        console.log("Server is listening on port 8000");
    });
});
