const Discord = require("discord.js");
module.exports = new Discord.MessageEmbed()
	.setColor("#e9e9e9")
	.setTitle("Commands")
	.addFields(
		{ name: ":desktop: Misc.", value: "`.help` `.ualive?` `.gamblestat` `.eval`"},
		{ name: ":female_sign: Gender switch", value: "`.imaboi` `.imagurl`" },
		{
			name: ":pick: Function",
			value:
				"`.roll` `.tellajoke` `.submitjoke` `.pick [online|bot]` `.scareme` `.lvling`",
		},
		{ name: ":game_die: Games", value: "`.play [mention a friend]`" },
		{ name: ":open_mouth: Emotes", value: "`.smh` `.doubt`" }
	)
	.setTimestamp()
	.setFooter("https://github.com/Tiffceet/Chat-Logger-Discord-Bot");
