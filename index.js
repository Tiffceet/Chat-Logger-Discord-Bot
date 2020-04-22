require("http")
	.createServer((req, res) => res.end("hello world"))
	.listen(3000);
const Discord = require("discord.js");
const fs = require("fs");
const connect_four = require("./games/connect_four");
const bot = new Discord.Client();
const token = JSON.parse(fs.readFileSync("auth.json")).token;

// ====================================================================================
// Global variables
// ====================================================================================
var jokes = require("./jokes");
var help_page = require("./help_page");
var status_msg = [
	"Yea, I'm here, lurking around, collecting data, bla bla bla.",
	"I know you miss me, I'm here",
	"Stop asking.",
	"I said stop",
	"I'm dead, happy now ?",
];

var last_user_that_called_me = "";
var how_many_times_i_was_called = 0;
var ongoing_game = undefined;
// ====================================================================================
// ====================================================================================

// ====================================================================================
// My Functions
// ====================================================================================
const getDateFast = () => {
	let today = new Date();
	let date =
		today.getFullYear() +
		"-" +
		(today.getMonth() + 1) +
		"-" +
		today.getDate();
	let time =
		("0" + today.getHours()).slice(-2) +
		":" +
		("0" + today.getMinutes()).slice(-2) +
		":" +
		("0" + today.getSeconds()).slice(-2);
	let dateTime = date + " " + time;
	return dateTime;
};

const loose_str_cmp = (str, target) => {
	let idx = 0;
	for (i = 0; i < str.length; i++) {
		if (str.charAt(i) == target.charAt(idx)) {
			idx++;
		}
	}
	return idx == target.length;
};

const updateOnlineCount = (guild) => {
	let onlineCount = 0;
	guild.members.cache.array().forEach((mem) => {
		if (!mem.user.bot && mem.user.presence.status != "offline") {
			onlineCount++;
		}
	});
	let ch = guild.channels.cache.find((channel) => {
		return channel.id === "698133538368782436";
	});

	// make sure channel is found before editing
	if (ch) {
		ch.edit({ name: `Available: ${onlineCount}` });
		// console.log("updateOnlineCount: Channel found and updated");
	} else {
		// console.log("updateOnlineCount: Channel cant be found");
	}
};

const updateBotOnlineCount = (guild) => {
	let onlineCount = 0;
	guild.members.cache.array().forEach((mem) => {
		if (mem.user.bot && mem.user.presence.status == "online") {
			onlineCount++;
		}
	});
	let ch = guild.channels.cache.find((channel) => {
		return channel.id === "698130150193233969";
	});

	// make sure channel is found before editing
	if (ch) {
		ch.edit({ name: `Bots Online: ${onlineCount}` });
		// console.log("updateOnlineCount: Channel found and updated");
	} else {
		// console.log("updateOnlineCount: Channel cant be found");
	}
};

const updateTotalMemberCount = (guild) => {
	let ch = guild.channels.cache.find((channel) => {
		return channel.id === "698133472648101928";
	});
	let mem_count = guild.members.cache.array().filter((member) => {
		return !member.user.bot;
	}).length;
	if (ch) {
		ch.edit({ name: `Total Member: ${mem_count}` });
	}
};

const updateChatLoggedCount = (guild) => {
	if (!guild) {
		console.log("updateChatLoggedCount(): Guild not found.");
		return;
	}
	let ch = guild.channels.cache.find((channel) => {
		return channel.id === "698134321294213181";
	});
	if (ch) {
		let num = parseInt(ch.name.substring(19, ch.name.length));
		num++;
		ch.edit({ name: `Total chat logged: ${num++}` });
	}
};
// ====================================================================================
// ====================================================================================

bot.login(token);

// ====================================================================================
// Commands functions
// ====================================================================================
const ualive = (message) => {
	if (message.author.username != last_user_that_called_me) {
		how_many_times_i_was_called = 0;
	}
	if (how_many_times_i_was_called > status_msg.length - 1) {
		how_many_times_i_was_called--;
	}
	message.reply(status_msg[how_many_times_i_was_called++]);
	last_user_that_called_me = message.author.username;
};

const help = (message) => {
	message.channel.send(help_page);
};

const imaboi = (message) => {
	let king_role = message.guild.roles.fetch("517755461773033473");
	let queen_role = message.guild.roles.fetch("549146956828770305");
	if (!king_role) {
		console.log("imaboi(): Failed to find King role (wrong id)");
		return;
	}
	if (!queen_role) {
		console.log("imaboi(): Failed to find Queen role (wrong id)");
		return;
	}
	message.member.roles.add("517755461773033473");
	message.member.roles.remove("549146956828770305");
	message.channel.send(
		`<@${message.author.id}> is now a boi.\nRole updated for <@${message.author.id}> as King.`
	);
};
const imagurl = (message) => {
	let king_role = message.guild.roles.fetch("517755461773033473");
	let queen_role = message.guild.roles.fetch("549146956828770305");
	if (!king_role) {
		console.log("imaboi(): Failed to find King role (wrong id)");
		return;
	}
	if (!queen_role) {
		console.log("imaboi(): Failed to find Queen role (wrong id)");
		return;
	}
	message.member.roles.remove("517755461773033473");
	message.member.roles.add("549146956828770305");
	message.channel.send(
		`<@${message.author.id}> is now a gurl.\nRole updated for <@${message.author.id}> as Queen.`
	);
};

const roll = (message) => {
	let min = 0;
	let max = 100;
	// extract number at the back if any
	let substr = message.content.substring(5, message.content.length);
	let convertedNum = parseInt(substr, 10);
	if (!isNaN(convertedNum)) {
		max = convertedNum;
	}
	message.channel.send(
		`<@${message.author.id}> rolled a ${
			Math.round(Math.random() * max + 1) - min - 1
		}`
	);
};

const tellajoke = (message) => {
	let len = jokes == null ? 0 : jokes.length;
	message.channel.send(jokes[Math.floor(Math.random() * len)]);
};

const submitjoke = (message) => {
	fs.appendFile(
		`custom_jokes.txt`,
		"::" + message.content.substring(12, message.content.length) + "\n",
		(err) => {
			if (err) console.log(err.message);
		}
	);
	message.channel.send(
		`Haha, good one. I'll save it down, for future use :sunglasses:`
	);
};

const pick = (message) => {
	let args = message.content.split(" ");
	let memberList = message.guild.members.cache.array().filter((mem) => {
		// if online arg is given
		let bool = true;
		if (args.includes("online")) {
			bool =
				(bool && mem.presence.status == "online") ||
				mem.presence.status == "idle";
		}

		if (!args.includes("bot")) {
			bool = bool && !mem.user.bot;
		}
		return bool;
	});
	let pickedUser =
		memberList[Math.floor(Math.random() * (memberList.length - 1))].user;
	message.channel.send(`${pickedUser.username}, you have been picked !`);
};

const play = (message) => {
	let args = message.content.split(" ");
	let p2_usr = undefined;
	if (args.length >= 2) {
		let id = args[1].replace(/[\\<>@#&!]/g, "");
		p2_usr = message.guild.members.cache.find((mem) => {
			return mem.user.id === id;
		});
		if (!p2_usr) {
			message.channel.send("This user doesn't exist you baka.");
			return;
		}
		if (p2_usr.user.bot) {
			message.channel.send("You cannot play with a bot you baka.");
			return;
		}
	} else {
		return;
	}
	if (ongoing_game) {
		message.channel.send(
			"Sorry, I'm able to start multiple games yet.\nMaybe you can rush Looz a lil bit to make this happen ?"
		);
		return;
	}
	ongoing_game = new connect_four(
		message.author.id,
		message.author.username,
		args[1].replace(/[\\<>@#&!]/g, ""),
		p2_usr.user.username,
		message.channel.id
	);
	message.channel.send("A game have been started!");
	message.channel.send(ongoing_game.getGridInEmoji());
	let ongoing_game_stat = ongoing_game.getStat();
	setTimeout(function () {
		if (ongoing_game) {
			if (ongoing_game_stat == ongoing_game.getStat()) {
				message.channel.send("Game aborted.");
				ongoing_game = undefined;
			}
		}
	}, 30000);
};

const scareme = (message) => {
	let rawdata = fs.readFileSync("two_sentence_horror.json");
	let horror = JSON.parse(rawdata);
	let idx = Math.floor(Math.random() * (horror.data.children.length - 1));
	message.channel.send(
		horror.data.children[idx].data.title +
			"\n" +
			horror.data.children[idx].data.selftext
	);
};
// ====================================================================================
// ====================================================================================

// ====================================================================================
// Conenct Four Listening Event
// ====================================================================================

const game_listening = (message) => {
	let timeout = 30000;
	// if game is ongoing and id matches the ongoing game's ch id
	if (ongoing_game && message.channel.id == ongoing_game.ch) {
		let num = -1;
		// if any side wants to end
		if (
			message.author.id == ongoing_game.p1 ||
			message.author.id == ongoing_game.p2
		) {
			if (message.content == ".end") {
				ongoing_game = undefined;

				message.channel.send(
					"The game has ended unexpectedly :<.\nAll blame " +
						message.author.username
				);
				return;
			}
		}
		// check for p1
		if (ongoing_game.turn == 1 && message.author.id == ongoing_game.p1) {
			num = parseInt(message.content, 10);
			if (isNaN(num)) {
				message.channel.send("That is not a valid col number (1-7).");
				return;
			}
			try {
				ongoing_game.play(num - 1);
				if (ongoing_game.checkGrid() == 1) {
					message.channel.send(`${ongoing_game.p1_name} had won !`);
					message.channel.send(ongoing_game.getGridInEmoji());
					ongoing_game = undefined;

					return;
				} else {
					message.channel.send(ongoing_game.getGridInEmoji());
				}
				let ongoing_game_stat = ongoing_game.getStat();
				// if the game was not attended, stop it
				setTimeout(function () {
					if (ongoing_game) {
						if (ongoing_game_stat == ongoing_game.getStat()) {
							message.channel.send(
								`Too weak, too slow.\nAs the result, ${
									ongoing_game.turn == 1
										? ongoing_game.p2_name
										: ongoing_game.p1_name
								} won the game.`
							);
							ongoing_game = undefined;
						}
					}
				}, timeout);
			} catch (err) {
				message.channel.send("That is not a valid col number (1-7).");
				return;
			}
		} else if (
			// check for p2
			ongoing_game.turn == 2 &&
			message.author.id == ongoing_game.p2
		) {
			num = parseInt(message.content, 10);
			if (isNaN(num)) {
				message.channel.send("That is not a valid col number (1-7).");
				return;
			}
			try {
				ongoing_game.play(num - 1);
				if (ongoing_game.checkGrid() == 2) {
					message.channel.send(`${ongoing_game.p2_name} had won !`);
					message.channel.send(ongoing_game.getGridInEmoji());
					ongoing_game = undefined;
					return;
				} else {
					message.channel.send(ongoing_game.getGridInEmoji());
				}
				let ongoing_game_stat = ongoing_game.getStat();
				// if the game was not attended, stop it

				setTimeout(function () {
					if (ongoing_game) {
						if (ongoing_game_stat == ongoing_game.getStat()) {
							message.channel.send(
								`Too weak, too slow.\nAs the result, ${
									ongoing_game.turn == 1
										? ongoing_game.p2_name
										: ongoing_game.p1_name
								} won the game.`
							);
							ongoing_game = undefined;
						}
					}
				}, timeout);
			} catch (err) {
				message.channel.send("That is not a valid col number (1-7).");
				return;
			}
		}
	}
};

// ====================================================================================
// ====================================================================================

// ====================================================================================
// Discord Client Events
// ====================================================================================
// on ready function
bot.on("ready", () => {
	bot.user.setPresence({
		activity: { name: "您的聊天记录", type: "WATCHING" },
		status: "online",
	});
	console.log("Bot is loaded");
});

// on message event
bot.on("message", (message) => {
	// if msg were sent from bots, ignore
	if (message.author.bot) {
		return;
	}
	/*
	// log msg
	let msg = `[${getDateFast()}]:[${message.author.username}] ${
		message.content
	}\n`;
	fs.appendFile(`logs/${message.channel.name}.txt`, msg, (err) => {
		if (err) console.log(err.message);
    });
    
    // only do it for lymerist server for now
	if (message.guild.id == "517721761115013120") {
		updateChatLoggedCount(message.guild);
	}
    */

	// listen to an ongoing connect four game
	game_listening(message);

	let this_msg = message.content;

	// check for command;
	if (this_msg.startsWith(".")) {
		if (this_msg.startsWith(".ualive")) {
			ualive(message);
		} else if (this_msg.startsWith(".help")) {
			help(message);
		} else if (this_msg.startsWith(".imaboi")) {
			imaboi(message);
		} else if (this_msg.startsWith(".imagurl")) {
			imagurl(message);
		} else if (this_msg.startsWith(".roll")) {
			roll(message);
		} else if (this_msg.startsWith(".tellajoke")) {
			tellajoke(message);
		} else if (this_msg.startsWith(".submitjoke ")) {
			submitjoke(message);
		} else if (this_msg.startsWith(".pick")) {
			pick(message);
		} else if (this_msg.startsWith(".doubt")) {
			message.channel.send("", {
				files: [
					"https://i.kym-cdn.com/entries/icons/facebook/000/023/021/e02e5ffb5f980cd8262cf7f0ae00a4a9_press-x-to-doubt-memes-memesuper-la-noire-doubt-meme_419-238.jpg",
				],
			});
		} else if (this_msg.startsWith(".smh")) {
			message.channel.send("", {
				files: [
					"https://media1.giphy.com/media/WrP4rFrWxu4IE/source.gif",
				],
			});
		} else if (this_msg.startsWith(".play")) {
			play(message);
		} else if (this_msg.startsWith(".scareme")) {
			scareme(message);
		} else {
			message.channel.send(help_page);
		}
	}
});

// on presenceUpdate event
bot.on("presenceUpdate", (od, nw) => {
	// make sure od is defined
	let server;
	if (od) {
		server = od.guild;
	} else {
		return;
	}
	updateOnlineCount(server);
});

bot.on("guildMemberAdd", (mem) => {
	updateTotalMemberCount(mem.guild);
});

bot.on("guildMemberRemove", (mem) => {
	updateTotalMemberCount(mem.guild);
});
// ====================================================================================
// ====================================================================================
