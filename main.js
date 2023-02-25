const http = require("http");
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
        const { repository, pusher, compare, head_commit } = body;
        let diff_raw_text = (await axios(compare + ".diff")).data;
        let i = diff_raw_text.indexOf("@");
        let [first, second] = [diff_raw_text.substring(0, i), diff_raw_text.substring(i)];
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
            "```js\n" + `// PUSH IN ${repository.name} //\n\npusher: '${pusher.name}'\nmessage: '${head_commit.message}'\ndate: '${formattedDate}'\nmodified: [ '${head_commit.modified.join("', '")}' ]` + "```" + "```diff\n" + first + "\n" + second + "```";

        const channel = client.channels.cache.get(process.env.CHANNEL_ID);
        if (channel) {
            channel.send(final_message);
            res.end("Message sent to Discord server");
        } else {
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
