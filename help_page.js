const Discord = require("discord.js");
module.exports = new Discord.MessageEmbed()
	.setColor("#e9e9e9")
	.setTitle("Commands")
	.addFields(
		{
			name: ":desktop: Misc.",
			value: "`.help` `.ualive?` `.gamblestat` `.eval`",
		},
		{ name: ":female_sign: Gender switch", value: "`.imaboi` `.imagurl`" },
		{
			name: ":pick: Function",
			value:
				"`.roll` `.submitjoke` `.pick [online|bot]` `.unscramble`",
		},
		{ name: ":b:eddit", value: "`.tellajoke` `.scareme` `.cursedfood`" },
		{ name: ":game_die: Games", value: "`.play [mention a friend]`" },
		{ name: ":open_mouth: Emotes", value: "`.smh` `.doubt` `.rekt` `.confuse`" },
		{ name: ":star: Anime", value: "`.anime` `.anilist`" },
		{ name: ":crystal_ball: Toram Online", value: "`.lvling` `.torammap` `.tomana`" }
	)
	.setTimestamp()
	.setFooter("https://github.com/Tiffceet/Chat-Logger-Discord-Bot");
