var debug_mode = false;

if (debug_mode) {
	require("dotenv").config();
}

import * as Classes from "../class";
import * as Modules from "../module";
const fs = require("fs");
import * as Discord from "discord.js";
import { CommandInfo } from "../interface/class/Command/CommandInfo";
const fetch = require("node-fetch");
const cheerio = require("cheerio");

<<<<<<< HEAD
if (!fs.existsSync("../tmp")) fs.mkdirSync("../tmp");
=======
if (!fs.existsSync("tmp")) {
	fs.mkdirSync("tmp");
}
>>>>>>> master

// ====================================================================================
// Class initialization
// ====================================================================================
const bot = new Discord.Client();
const PinkFredorFirebase = new Classes.PinkFredorFirebase(
	Buffer.from(process.env.FIREBASE_PRIVATE_KEY, "base64").toString("ascii")
);
const MAL = new Classes.MAL(process.env.MAL_CLIENT_SECRET, PinkFredorFirebase);
const GoogleDriveAPI = new Classes.GoogleDriveAPI(
	Buffer.from(process.env.DRIVE_CLIENT_SECRET, "base64").toString("ascii"),
	PinkFredorFirebase
);
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
const PrivateMusicCollection = new Modules.PrivateMusicCollection(
	GoogleDriveAPI
);
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

<<<<<<< HEAD
	let cmd: Classes.Command = new Classes.Command(".dev");
=======
	let gpfx = Miscellaneous.guild_prefixes.find(
		(e: any) => e.id == message.guild.id
    );

    let guild_prefix = ".";
    if(typeof gpfx !== "undefined")
    {
        guild_prefix = gpfx.content.prefix;
    }
    

	let cmd: Classes.Command = new Classes.Command(
		debug_mode ? ".dev" : guild_prefix
	);
>>>>>>> master

	cmd_info = await cmd.parse(message.content);

	// console.log(cmd_info);
<<<<<<< HEAD

=======
>>>>>>> master
	switch (cmd_info["module_name"]) {
		case "Miscellaneous":
			Miscellaneous._worker(
				message,
				cmd_info.command_name,
				cmd_info.args
			);
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
<<<<<<< HEAD
		case "PrivateMusicCollection":
			PrivateMusicCollection._worker(
				message,
				cmd_info.command_name,
				cmd_info.args
			);
			break;
=======
>>>>>>> master
	}
});
