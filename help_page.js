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
				"`.roll` `.submitjoke` `.pick [online|bot]` `.lvling` `.unscramble`",
		},
		{ name: ":b:eddit", value: "`.tellajoke` `.scareme` `.cursedfood`" },
		{ name: ":game_die: Games", value: "`.play [mention a friend]`" },
		{ name: ":open_mouth: Emotes", value: "`.smh` `.doubt` `.rekt`" },
		{ name: ":star: Anime", value: "`.anime`" }
	)
	.setTimestamp()
	.setFooter("https://github.com/Tiffceet/Chat-Logger-Discord-Bot");
