"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug_mode = true;
if (debug_mode) {
    require("dotenv").config();
}
const Classes = require("../class_TS");
const Modules = require("../module_TS");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const bot = new Discord.Client();
const PinkFredorFirebase = new Classes.PinkFredorFirebase(Buffer.from(process.env.FIREBASE_PRIVATE_KEY, "base64").toString("ascii"));
const MAL = new Classes.MAL(process.env.MAL_CLIENT_SECRET, PinkFredorFirebase);
const Anime = new Modules.Anime(MAL);
const Miscellaneous = new Modules.Miscellaneous(PinkFredorFirebase);
const Emotes = new Modules.Emotes();
const Reddit = new Modules.Reddit();
const Tool = new Modules.Tool();
bot.login(process.env.TOKEN);
async function preload() { }
bot.on("ready", async () => {
    console.log("bot is ready");
});
bot.on("message", async (message) => {
    if (debug_mode && message.guild.id != "779331940843126814") {
        return;
    }
    if (message.author.bot) {
        return;
    }
    if (!Miscellaneous._init_status) {
        return;
    }
    let cmd_info = {
        is_command: false,
        command_name: "",
        module_name: "",
        module_path: "",
        module_dependency: [],
        args_count: 0,
        args: [],
    };
    let cmd = new Classes.Command(".dev");
    cmd_info = await cmd.parse(message.content);
    switch (cmd_info["module_name"]) {
        case "Miscellaneous":
            Miscellaneous._worker(message, cmd_info.command_name, cmd_info.args);
            break;
        case "Anime":
            Anime._worker(message, cmd_info.command_name, cmd_info.args);
            break;
        case "Emotes":
            Emotes._worker(message, cmd_info.command_name, cmd_info.args);
            break;
        case "Reddit":
            Reddit._worker(message, cmd_info.command_name, cmd_info.args);
            break;
        case "Tool":
            Tool._worker(message, cmd_info.command_name, cmd_info.args);
            break;
    }
});
//# sourceMappingURL=index.js.map