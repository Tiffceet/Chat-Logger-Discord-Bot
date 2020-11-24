var debug_mode = true;

if(debug_mode) {
	require("dotenv").config();
}
const fs = require("fs");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const bot = new Discord.Client();

// ====================================================================================
// Secrets
// ====================================================================================

bot.login(process.env.TOKEN);

// ====================================================================================
// ====================================================================================

let CLASSES = {}; // All imported classes
let CLASS_INSTANCES = {}; // Global class instances
let MODULES = {}; // All imported modules

// Function to preload all the classes and modules
async function preload() {
	// Import all classes
	let cls = fs.promises.readdir("./class");
	let mdl = fs.promises.readdir("./module");
	let filenames = await Promise.all([cls, mdl]);
	for (let filename of filenames[0]) {
		let class_name = filename.slice(0, -3);
		CLASSES[class_name] = require("./class/" + filename);
	}

	// Global Class instances
	CLASS_INSTANCES["PinkFredorFirebase"] = new CLASSES["PinkFredorFirebase"](
		new Buffer.from(process.env.FIREBASE_PRIVATE_KEY, "base64").toString(
			"ascii"
		)
    );

    CLASS_INSTANCES["GoogleDriveAPI"] = new CLASSES["GoogleDriveAPI"](
		new Buffer.from(process.env.DRIVE_CLIENT_SECRET, "base64").toString(
			"ascii"
		), CLASS_INSTANCES["PinkFredorFirebase"]
    );

    CLASS_INSTANCES["MAL"] = new CLASSES["MAL"](process.env.MAL_CLIENT_SECRET, CLASS_INSTANCES["PinkFredorFirebase"]);

	// Import all modules and include their dependency
	let module_desc = JSON.parse(fs.readFileSync("./data/ModuleDesc.json"));
	for (let filename of filenames[1]) {
		let module_name = filename.slice(0, -3);
		let module_dependency = {};
		for (
			let i = 0;
			i < module_desc["module"][module_name]["dependency"].length;
			i++
		) {
			module_dependency[
				module_desc["module"][module_name]["dependency"][i]
			] =
				CLASS_INSTANCES[
					module_desc["module"][module_name]["dependency"][i]
				];
		}
        MODULES[module_name] = require("./module/" + filename);
        MODULES[module_name]["_import"](module_dependency);
        MODULES[module_name]["_init"]();
	}
}

bot.on("ready", async () => {
    await preload();
    await MODULES["ScheduledJob"]._init(bot);
	console.log("Bot is loaded");
});

bot.on("message", async (message) => {
    if(debug_mode && message.guild.id != 680297709420412942) {
        return;
    }

	if (message.author.bot) {
		return;
    }
    
    // Get Guild Prefix from Misc. Module
    if(!MODULES["Miscellaneous"]._init_status) {
        // If the mdule is not ready
        return;
    }
    let g_prefix = MODULES["Miscellaneous"].guild_prefixes.find(e=>e.id==message.guild.id);
    if(typeof g_prefix !== "undefined") {
        g_prefix = g_prefix.content.prefix;
    } else {
        g_prefix = MODULES["Miscellaneous"].DEFAULT_PREFIX;
    }

    // console.log(g_prefix);
    // New Command instance for every single message as they might come from different server
	let command = new CLASSES["Command"](debug_mode ? ".dev" : g_prefix);
	let cmd_info = {
		is_command: false,
		command_name: "",
		module_name: "",
		module_path: "",
		module_dependency: [],
		args_count: 0,
		args: [],
	};

	// Parse info about this message
	cmd_info = await command.parse(message.content);

	// Stop if its just a normal message
	if (!cmd_info.is_command) {
		return;
	}

	MODULES[cmd_info.module_name]["_worker"](
		message,
		cmd_info.command_name,
		cmd_info.args
	);
});
