const http = require("http");

require("dotenv").config();
const { Client, Events, GatewayIntentBits } = require("discord.js");

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
    req.on("end", () => {
        const channel = client.channels.cache.get(process.env.CHANNEL_ID);
        if (channel) {
            channel.send("Salut " + body);
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
