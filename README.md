# DiscordPushBot 3

The project will be a webhook that receives data from GitHub's API when a push is made to a remote repository. The webhook will then use the Discord API to send a message to a specified channel in a Discord server. The message will be formatted to include information about the push, such as the branch that was pushed, the commit message, and the name of the person who made the push.  

To accomplish this, the project will use Node.js and two libraries: 'http' to create a server that listens for incoming webhook requests, and 'discord.js' to send messages to the Discord server. When a webhook request is received, the server will extract the relevant information from the request payload, format it into a Discord message, and use the Discord API to send the message to the specified channel.

The project will include instructions on how to set up the webhook on GitHub, as well as how to set up a bot on Discord and obtain the necessary credentials to use the Discord API. It will also include configuration options for customizing the format and content of the messages that are sent to Discord, to allow users to tailor the notifications to their specific needs.
