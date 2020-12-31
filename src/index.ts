var debug_mode = true;

if (debug_mode) {
	require("dotenv").config();
}

import * as Classes from "../class";
import * as Modules from "../module";
import * as Discord from "discord.js";
import * as fs from "fs";
import { CommandInfo } from "../interface/class/Command/CommandInfo";
const fetch = require("node-fetch");
const cheerio = require("cheerio");

// ====================================================================================
// Class initialization
// ====================================================================================
const bot = new Discord.Client();
const PinkFredorFirebase = new Classes.PinkFredorFirebase(
	Buffer.from(process.env.FIREBASE_PRIVATE_KEY, "base64").toString("ascii")
);
const MAL = new Classes.MAL(process.env.MAL_CLIENT_SECRET, PinkFredorFirebase);
// ====================================================================================
// ====================================================================================

// ====================================================================================
// Module Initialization
// ====================================================================================
const Anime = new Modules.Anime(MAL);
const Miscellaneous = new Modules.Miscellaneous(PinkFredorFirebase);
const Emotes = new Modules.Emotes();
const Reddit = new Modules.Reddit();
const Tool = new Modules.Tool();
const ScheduledJob = new Modules.ScheduledJob(PinkFredorFirebase, bot);
// ====================================================================================
// ====================================================================================

// ====================================================================================
// Secrets
// ====================================================================================

bot.login(process.env.TOKEN);

// ====================================================================================
// ====================================================================================

async function preload() {}

bot.on("ready", async () => {
    console.log("bot is ready");
});

bot.on("message", async (message: Discord.Message) => {
	if (debug_mode && message.guild.id != "779331940843126814") {
		return;
	}

	if (message.author.bot) {
		return;
	}

	// If Miscelleous Module is not ready just stop
	if (!Miscellaneous._init_status) {
		return;
	}

	let cmd_info: CommandInfo = {
		is_command: false,
		command_name: "",
		module_name: "",
		module_path: "",
		module_dependency: [],
		args_count: 0,
		args: [],
	};

    let cmd: Classes.Command = new Classes.Command(".dev");
    
    cmd_info = await cmd.parse(message.content);

    // console.log(cmd_info);

    switch(cmd_info["module_name"]) {
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
