const Discord = require("discord.js");
const firebase = require("firebase/app");
require("firebase/firestore");
const firebase_admin = require("firebase-admin");
const firebase_serviceAccount = require("./pinkfredor-firebase-adminsdk-ujfaz-4c1e8a5d88.json");
const fetch = require("node-fetch");
const fs = require("fs");
const cheerio = require("cheerio");
const { exec } = require("child_process");
const connect_four = require("./games/connect_four");
const coryn = require("./games/coryn");
const anilist_API = require("./libs/anilist_API");
const toram_map_navigator = require("./games/toram_map_navigator");
const MCServer = require("./libs/pterodactyl_API");
const mcapi = new MCServer(); // as requested by the api, login on start of app
const bot = new Discord.Client();

// ====================================================================================
// Secrets
// ====================================================================================
const token = process.env.TOKEN;
firebase_serviceAccount.private_key = new Buffer.from(
	process.env.FIREBASE_PRIVATE_KEY,
	"base64"
).toString("ascii");
// ====================================================================================
// ====================================================================================

// ====================================================================================
// Firebase init
// ====================================================================================
firebase_admin.initializeApp({
	credential: firebase_admin.credential.cert(firebase_serviceAccount),
	databaseURL: "https://pinkfredor.firebaseio.com",
});
// ====================================================================================
// ====================================================================================

// ====================================================================================
// Global variables
// ====================================================================================
var global_prefix = ".";
var guilds_prefixes = {}; // format: {"guild_1_ID": "prefix", "guild_2_ID": "prefix", ...}
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

// Adding replace all function to strings
String.prototype.replaceAll = function (searchStr, replaceStr) {
	var str = this;

	// escape regexp special characters in search string
	searchStr = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

	return str.replace(new RegExp(searchStr, "gi"), replaceStr);
};

const reloadGuildPrefix = async () => {
	let db = firebase_admin.firestore();
	let querySnapshot = await db.collection("guilds").get();
	querySnapshot.forEach(function (doc) {
		guilds_prefixes[doc.id] = doc.data().prefix;
	});
};

const getGuildPrefixByID = (guild_id) => {
	if (guild_id == null) return;
	let prefix = global_prefix;
	if (guilds_prefixes[guild_id] != undefined) {
		prefix = guilds_prefixes[guild_id];
	}
	return prefix;
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
	let args = message.content.split(" ");
	let help_desr = JSON.parse(fs.readFileSync("./data/help_desr.json"));
	if (args.length >= 2) {
		if (help_desr[args[1]]) {
			message.channel.send(
				new Discord.MessageEmbed().setTitle(args[1]).addFields(
					{
						name: "Description",
						value: `${help_desr[args[1]].desr}`,
					},
					{ name: "Usage", value: `${help_desr[args[1]].usage}` }
				)
			);
			return;
		}
	}
	message.channel.send(help_page);
};

const imaboi = (message) => {
	if (message.guild.id != "517721761115013120") {
		message.channel.send("Sorry, this is limited to Lymerist server only.");
		return;
	}
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
	if (message.guild.id != "517721761115013120") {
		message.channel.send("Sorry, this is limited to Lymerist server only.");
		return;
	}
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
	let args = message.content.split(" ");
	if (args.length >= 2) {
		let substr = args[1];
		let convertedNum = parseInt(substr, 10);
		if (!isNaN(convertedNum)) {
			max = convertedNum;
		}
	}
	message.channel.send(
		`<@${message.author.id}> rolled a ${Math.floor(
			Math.random() * max - min
		)}`
	);
};

const tellajoke = (message) => {
	let args = message.content.split(" ");
	let url = "";
	if (args[1] && args[1] == "dirty") {
		url =
			"https://www.reddit.com/r/DirtyJokes/.json?sort=hot&t=week&limit=300";
	} else {
		url =
			"https://www.reddit.com/r/ShortCleanFunny/.json?sort=hot&t=week&limit=300";
	}
	fetch(url)
		.then((res) => res.json())
		.then((json) => {
			try {
				let len = Math.floor(
					Math.random() * (json.data.children.length - 1)
				);
				message.channel.send(
					new Discord.MessageEmbed()
						.setTitle(json.data.children[len].data.title)
						.setDescription(json.data.children[len].data.selftext)
						.setColor(
							"#" + ((Math.random() * 0xffffff) << 0).toString(16)
						)
				);
			} catch (err) {
				console.log(
					"Error getting post from r/ShortCleanFunny, contact Looz !"
				);
			}
		});
};

const submitjoke = (message) => {
	let args = message.content.split(" ");
	if (args.length < 2) {
		message.channel.send("Uhh...");
		return;
	}
	fs.appendFile(
		`custom_jokes.txt`,
		"::" + args.slice(1).join(" ") + "\n",
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
		if (p2_usr.user.bot && p2_usr.user.id != "697682159355428875") {
			message.channel.send("You cannot play with a bot you baka.");
			return;
		}
	} else {
		message.channel.send(
			"Mention a friend to play with ! Or you can play me instead."
		);
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

// make use of node-fetch
const scareme = (message) => {
	fetch(
		"https://www.reddit.com/r/TwoSentenceHorror/.json?sort=hot&t=week&limit=300"
	)
		.then((res) => res.json())
		.then((json) => {
			try {
				let len = Math.floor(
					Math.random() * (json.data.children.length - 1)
				);
				message.channel.send(
					new Discord.MessageEmbed()
						.setTitle(json.data.children[len].data.title)
						.setDescription(json.data.children[len].data.selftext)
				);
			} catch (err) {
				console.log(
					"Error getting post from r/TwoSentenceHorror, contact Looz !"
				);
			}
		});
};

const lvling = (message) => {
	let args = message.content.split(" ");
	if (args < 2) {
		message.reply(
			"What? How do you expect me to give you anything w/o you giving me your current level."
		);
		return;
	}
	if (isNaN(args[1])) {
		message.reply("Try again, but with a valid level number");
		return;
	}
	let coryn_request = new coryn();
	coryn_request.get_exp_list_boss(parseInt(args[1]));
	message.channel.send(
		"I'm fetching data from Coryn...\nPlease wait for 6 seconds..."
	);
	setTimeout(function () {
		// console.log(coryn_request.obj);
		let embeds_field = [];
		let idx = 0;
		coryn_request.obj.data.forEach(function (data) {
			embeds_field[idx] = {
				name: `${data.lvl} ${data.name}`,
				value: `Location: ${data.venue}\n${data.exp}`,
			};
			idx++;
		});
		message.channel.send(
			new Discord.MessageEmbed()
				.setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16)) // generate random hex color
				.setTitle(`Player Lv ${args[1]}`)
				.setAuthor("Coryn")
				.addFields(
					embeds_field.slice(
						0,
						embeds_field.length > 10 ? 10 : embeds_field.length
					)
				)
		);
	}, 6000);
};

const gamblestat = (message) => {
	let args = message.content.split(" ");
	if (!args[1] || isNaN(args[1])) {
		message.reply("You need to give me a base bet amount.");
		return;
	}

	let bet_amt = [parseInt(args[1])];
	for (let i = 1; i < 9; i++) {
		let sum = bet_amt.reduce((a, b) => a + b, 0);
		bet_amt[i] = sum * 4;
	}

	message.channel.send(
		new Discord.MessageEmbed()
			.setColor("#75ddff")
			.setTitle("Dank Memer gambling stategies")
			.setDescription(
				"This game is rigged, please dont spend too much time on it\n\nBut the idea is, if you lose, then you just have to bet bigger, as for how much you need to bet, just follow the table below"
			)
			.addFields(
				{ name: "Base bet amount", value: `${args[1]}` },
				{
					name: "% of losing",
					value:
						"53.47\n28.59\n15.28\n8.17\n4.37\n2.33\n1.24\n0.66\n0.35",
					inline: true,
				},
				{
					name: "Bet amount",
					value: `${bet_amt[0]}\n${bet_amt[1]}\n${bet_amt[2]}\n${bet_amt[3]}\n${bet_amt[4]}\n${bet_amt[5]}\n${bet_amt[6]}\n${bet_amt[7]}\n${bet_amt[8]}`,
					inline: true,
				}
			)
	);
};

const eval_cmd = (message) => {
	if (message.author.id !== "246239361195048960") {
		message.channel.send("Sorry, only Looz can do that");
		return;
	}
	try {
		let args = message.content.split(" ");
		let cmd = args.slice(1).join(" ");
		message.channel.send(eval(cmd));
	} catch (err) {
		message.channel.send(
			"Shame on you Looz, even a programmer make such silly syntax mistake."
		);
	}
};

const cursedfood = (message) => {
	fetch(
		"https://www.reddit.com/r/cursedfoods/.json?sort=hot&t=week&limit=800"
	)
		.then((res) => res.json())
		.then((json) => {
			try {
				let len = Math.floor(
					Math.random() * (json.data.children.length - 1)
				);
				message.channel.send(
					new Discord.MessageEmbed()
						.setTitle("r/CursedFood")
						.setImage(json.data.children[len].data.url)
				);
			} catch (err) {
				console.log(
					"Error getting post from r/CursedFood, contact Looz !"
				);
			}
		});
};

const unscramble = (message) => {
	let args = message.content.split(" ");
	if (args.length != 2) {
		message.reply("You might want to try it again.");
		return;
	}
	let word = args[1];
	exec(
		`curl -s -X POST -d "letters=${word}&dictionary=twl&repeat=no" https://wordunscrambler.me/unscramble > tmp/del.html`,
		(error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
				return;
			}
		}
	);
	message.channel.send("Unscrambling...");
	let unscrambled_words = [];
	setTimeout(() => {
		try {
			let $ = cheerio.load(fs.readFileSync("tmp/del.html"));
			let answers = $("div.result .list-wrapper ul").children();
			for (let i = 0; i < answers.length; i++) {
				if (
					answers[i].children[0].children[0].data.trim().length !=
					word.length
				) {
					continue;
				}
				unscrambled_words.push(
					answers[i].children[0].children[0].data.trim()
				);
			}
			if (unscrambled_words.length != 0) {
				message.channel.send(
					"Possible word(s): " + unscrambled_words.join(", ")
				);
			} else {
				message.channel.send(
					`Sorry but i could not unscramble ${word}`
				);
			}
		} catch (err) {
			console.log(err);
			message.channel.send(`Sorry but i could not unscramble ${word}`);
		}
	}, 6000);
};

const anime = (message, isHentai, isManga) => {
	let args = message.content.split(" ");
	let anime_name = args.length > 1 ? args.slice(1).join(" ") : "";
	if (!anime_name) {
		message.channel.send("Please provide an anime name.");
		return;
	}
	let obj = new anilist_API();
	obj.anime_query(anime_name, message, isHentai, isManga);
};

const torammap = (message) => {
	let toram = new toram_map_navigator();
	let desc, page_num, map_listing, embed;
	page_num = 1;
	let update_desc = (page_num) => {
		desc = "id mapname\n";
		map_listing = toram.get_maplist(page_num);

		for (let a = 0; a < map_listing.length; a++) {
			desc += `${map_listing[a][0]} ${map_listing[a][1]}\n`;
		}

		embed = new Discord.MessageEmbed()
			.setTitle("Toram Map Navigator")
			.setDescription(desc);
	};
	update_desc(page_num);
	message.channel.send(embed).then((msg) => {
		msg.react("◀").then((r) => {
			msg.react("▶");
			const prev = msg.createReactionCollector(
				(reaction, user) =>
					reaction.emoji.name === "◀" && user.id == message.author.id,
				{
					time: 60000,
				}
			);
			const next = msg.createReactionCollector(
				(reaction, user) =>
					reaction.emoji.name === "▶" && user.id == message.author.id,
				{
					time: 60000,
				}
			);
			prev.on("collect", (r) => {
				if (page_num <= 1) return;
				update_desc(--page_num);
				msg.edit(embed);
			});
			next.on("collect", (r) => {
				if (page_num >= 5) return;
				update_desc(++page_num);
				msg.edit(embed);
			});
		});
	});
};

const tomana = (message) => {
	// =====================================
	// Weirdest argument parsing i ever had
	// =====================================
	let args = message.content.split(" ");
	if (args.length < 3) {
		message.channel.send(
			"You need to give me map names / id\nTo view id, do `.torammap`"
		);
		return;
	}

	args.forEach((element, idx) => {
		if (element[0] == '"' && element.slice(-1)[0] == '"') {
			args[idx] = element.substring(1, element.length - 1);
		}
	});
	let tmp = "";
	let continue_append = false;
	let new_args = [];
	for (let a = 0; a < args.length; a++) {
		if (args[a].indexOf('"') > -1) {
			if (continue_append) {
				continue_append = false;
				tmp += " " + args[a].substring(0, args[a].length - 1);
				new_args.push(tmp);
				tmp = "";
			} else {
				tmp = tmp + args[a].substring(1, args[a].length);
				continue_append = true;
			}
			continue;
		}
		if (continue_append) {
			tmp += " " + args[a];
			continue;
		}
		new_args.push(args[a]);
	}
	args = new_args.slice();
	// =====================================
	// =====================================
	let toram = new toram_map_navigator();
	let source = -1,
		dest = -1;
	// if source is a number
	if (!isNaN(parseInt(args[1]))) {
		// if the idx is not valid
		if (!toram.raw_data[parseInt(args[1])]) {
			message.channel.send(
				`Sorry, I couldn't find map with id \"${args[1]}\"`
			);
			return;
		}
		source = parseInt(args[1]);
	} else if (toram.get_idx_from_name(args[1]) == -1) {
		message.channel.send(
			`Sorry, I couldn't find map with name \"${args[1]}\"`
		);
		return;
	} else {
		source = toram.get_idx_from_name(args[1]);
	}

	// if dest is a number
	if (!isNaN(parseInt(args[2]))) {
		// if the idx is not valid
		if (!toram.raw_data[parseInt(args[2])]) {
			message.channel.send(
				`Sorry, I couldn't find map with id \"${args[2]}\"`
			);
			return;
		}
		dest = parseInt(args[2]);
	} else if (toram.get_idx_from_name(args[2]) == -1) {
		message.channel.send(
			`Sorry, I couldn't find map with name \"${args[2]}\"`
		);
		return;
	} else {
		dest = toram.get_idx_from_name(args[2]);
	}
	toram.run(source, dest);
	message.channel.send(toram.result_path.join(" --> "));
};

const anilist = (message) => {
	let db = firebase_admin.firestore();
	let alAPI = new anilist_API(db);
	let args = message.content.split(" ");
	if (args[1] == "link") {
		let user_name = args[2];
		// there should be a link function but then im not sure how to do it
		let db = firebase_admin.firestore();
		alAPI.link(user_name, message);
		return;
	}
	if (args[1] == "unlink") {
		alAPI.unlink(message.author.id).then((status) => {
			message.channel.send(
				status
					? "Successfully unlinked your anilist profile"
					: "You can't unlink if you don't link first, you baka."
			);
		});
		return;
	}

	// if user only entered .anilist
	if (args.length == 1) {
		alAPI.find_linked_anilist_profile(message.author.id).then((al_id) => {
			if (!al_id) {
				message.channel.send(
					"Please link your anilist profile first\n`.anilist link <username>`"
				);
				return;
			}
			alAPI.user_activity_query(al_id, message);
		});
	}
};

const prefix = (message) => {
	let args = message.content.split(" ");
	let guild_id = message.guild.id;
	let db = firebase_admin.firestore();
	let guild_ref = db.collection("guilds").doc(guild_id);
	if (args.length > 1) {
		let new_prefix = args[1].charAt(0);
		// if there exist old records, replace em
		guild_ref.get().then(function (doc) {
			if (doc.exists) {
				guild_ref.update({ prefix: new_prefix }).then(() => {
					reloadGuildPrefix(); // this need to called to update local prefixes
				});
			} else {
				guild_ref
					.set({
						prefix: new_prefix,
						name: `${message.guild.name}`,
					})
					.then(() => {
						reloadGuildPrefix(); // this need to called to update local prefixes
					});
			}
			message.channel.send(
				`The prefix for this server had changed to \`${new_prefix}\``
			);
		});
	} else {
		// print current server prefix
		guild_ref.get().then(function (doc) {
			if (doc.exists) {
				message.channel.send(
					`The prefix for this server is \`${doc.data().prefix}\``
				);
			} else {
				message.channel.send(`The prefix for this server is \`.\``);
			}
		});
	}
};

const mc = (message) => {
    if (message.guild.id != "655770436629561394" || message.channel.id != "712528849648484403") {
        message.channel.send("Sorry but you cant do that here.");
        return;
    }
	let args = message.content.split(" ");
	let sub_cmd = args[1];

	if (mcapi.status == mcapi.NOT_READY) {
		message.channel.send(
			"Something went wrong in the Pterodactyl API, ask Looz to check."
		);
		mcapi.api_login();
		return;
	}
	switch (sub_cmd) {
		case "start":
			mcapi.startServer().then((msg) => {
				message.channel.send(`${msg}`);
			});
			break;
		case "status":
			mcapi.getServerStatus().then((msg) => {
				message.channel.send(`The server is ${msg}`);
			});
			break;
		case "stop":
			mcapi.stopServer().then((msg) => {
				message.channel.send(msg);
			});
            break;
        default:
            message.channel.send("Do `.help mc` to see the commands");
	}
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
				} else if (ongoing_game.is_full()) {
					message.channel.send(`It was a draw !`);
					message.channel.send(ongoing_game.getGridInEmoji());
					ongoing_game = undefined;
					return;
				} else {
					message.channel.send(ongoing_game.getGridInEmoji());
					// IF P2 IS SET TO MY BOT
					if (ongoing_game.p2 == "697682159355428875") {
						ongoing_game.play(ongoing_game.best_move());
						if (ongoing_game.checkGrid() == 2) {
							message.channel.send(
								`<@${ongoing_game.p1}> lost against a bot lol, you suck.`
							);
							message.channel.send(ongoing_game.getGridInEmoji());
							ongoing_game = undefined;
							return;
						} else if (ongoing_game.is_full()) {
							message.channel.send(`It was a draw !`);
							message.channel.send(ongoing_game.getGridInEmoji());
							ongoing_game = undefined;
							return;
						} else {
							message.channel.send(ongoing_game.getGridInEmoji());
						}
					}
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
				console.log(err);
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
				} else if (ongoing_game.is_full()) {
					message.channel.send(`It was a draw !`);
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
bot.on("ready", async () => {
	await reloadGuildPrefix();
	bot.user.setPresence({
		activity: { name: "您的聊天记录", type: "WATCHING" },
		status: "online",
	});
	console.log("Bot is loaded");
});

// on message event
bot.on("message", async (message) => {
	// if msg were sent from bots, ignore
	if (message.author.bot) {
		return;
	}
	/*
	// log msg (Uncommnt this part to start logging)
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

	current_prefix = getGuildPrefixByID(message.guild.id);
	if (current_prefix == null) return;

	let this_msg = message.content;

	// check for command;
	if (this_msg.startsWith(current_prefix)) {
		switch (message.content.split(" ")[0].slice(current_prefix.length)) {
			case "ualive":
				ualive(message);
				break;
			case "help":
				help(message);
				break;
			case "imaboi":
				imaboi(message);
				break;
			case "imagurl":
				imagurl(message);
				break;
			case "roll":
				roll(message);
				break;
			case "tellajoke":
				tellajoke(message);
				break;
			case "submitjoke":
				submitjoke(message);
				break;
			case "doubt":
				message.channel.send("", {
					files: [
						"https://i.kym-cdn.com/entries/icons/facebook/000/023/021/e02e5ffb5f980cd8262cf7f0ae00a4a9_press-x-to-doubt-memes-memesuper-la-noire-doubt-meme_419-238.jpg",
					],
				});
				break;
			case "smh":
				message.channel.send("", {
					files: [
						"https://media1.giphy.com/media/WrP4rFrWxu4IE/source.gif",
					],
				});
				break;
			case "rekt":
				message.channel.send("", {
					files: [
						"https://media.giphy.com/media/vSR0fhtT5A9by/giphy.gif",
					],
				});
				break;
			case "confuse":
				message.channel.send(
					new Discord.MessageEmbed()
						.setImage(
							"https://media.giphy.com/media/1X7lCRp8iE0yrdZvwd/giphy.gif"
						)
						.setTitle(`${message.author.username} is confused.`)
				);
				break;
			case "play":
				play(message);
				break;
			case "scareme":
				scareme(message);
				break;
			case "lvling":
				lvling(message);
				break;
			case "gamblestat":
				gamblestat(message);
				break;
			case "eval":
				eval_cmd(message);
				break;
			case "cursedfood":
				cursedfood(message);
				break;
			case "unscramble":
				unscramble(message);
				break;
			case "anime":
				anime(message);
				break;
			case "hentai":
				hentai(message);
				break;
			case "manga":
				manga(message);
				break;
			case "tomana":
				tomana(message);
				break;
			case "torammap":
				torammap(message);
				break;
			case "anilist":
				anilist(message);
				break;
			case "prefix":
				prefix(message);
				break;
			case "mc":
				mc(message);
				break;
		}
	}
});

// on presenceUpdate event
bot.on("presenceUpdate", (od, nw) => {
	// make sure od is defined
	setTimeout(() => {
		let server;
		if (nw) {
			server = nw.guild;
		} else {
			return;
		}
		updateOnlineCount(server);
	}, 5000);
});

bot.on("guildMemberAdd", (mem) => {
	updateTotalMemberCount(mem.guild);
});

bot.on("guildMemberRemove", (mem) => {
	updateTotalMemberCount(mem.guild);
});
// ====================================================================================
// ====================================================================================
