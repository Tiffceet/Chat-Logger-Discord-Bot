var debug_mode = false;

if (debug_mode) {
	require("dotenv").config();
}

import * as Classes from "../class";
import * as Modules from "../module";
const fs = require("fs");
import * as Discord from "discord.js";
import { CommandInfo } from "../interface/class/Command/CommandInfo";
import { FirebaseCollection } from "../interface/class/PinkFredorFirebase/FirebaseCollection";
const fetch = require("node-fetch");
const cheerio = require("cheerio");

if (!fs.existsSync("tmp")) {
	fs.mkdirSync("tmp");
}

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
const DMCommands = new Modules.DMCommands();
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
9
async function preload() { }

bot.on("ready", async () => {
	console.log("bot is ready");
});

bot.on("message", async (message: Discord.Message) => {
	let msg_isDM = false;
	if (message.guild === null) {
		// This is an DM
		msg_isDM = true;
	}

	if (!msg_isDM && debug_mode && message.guild.id != "680297709420412942") {
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

	let gpfx: FirebaseCollection;
	if (!msg_isDM) {
		gpfx = Miscellaneous.guild_prefixes.find(
			(e: any) => e.id == message.guild.id
		);
	}

	let guild_prefix = ".";
	if (typeof gpfx !== "undefined") {
		guild_prefix = gpfx.content.prefix;
	}


	let cmd: Classes.Command = new Classes.Command(
		debug_mode ? ".dev" : guild_prefix
	);

	cmd_info = await cmd.parse(message.content);

	// console.log(cmd_info);
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
		case "PrivateMusicCollection":
			PrivateMusicCollection._worker(message, cmd_info.command_name, cmd_info.args);
		case "DMCommands":
			DMCommands._worker(message, cmd_info.command_name, cmd_info.args);
	}
});

bot.on("messageDelete", async (msg: Discord.Message) => {
	DMCommands.log_deleted_msg(msg);
});