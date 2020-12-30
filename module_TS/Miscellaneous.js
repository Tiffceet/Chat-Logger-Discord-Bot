"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Miscellaneous = void 0;
const fs = require("fs");
const Discord = require("discord.js");
class Miscellaneous {
    constructor(PinkFredorFirebase_instance) {
        this._init_status = false;
        this.ualive_last_called_by = undefined;
        this.ualive_last_called_streak = 0;
        this.ualive_last_called_timestamp = undefined;
        this.ualive_status_msg = [
            "Yea, I'm here, lurking around, collecting data, bla bla bla.",
            "I know you miss me, I'm here",
            "Stop asking.",
            "I said stop",
            "I'm dead, happy now ?"
        ];
        this.guild_prefixes = {};
        if (typeof PinkFredorFirebase_instance !== "undefined")
            this.PinkFredorFirebase_instance = PinkFredorFirebase_instance;
        this._init_status = true;
    }
    _worker(origin, cmd_name, args) {
        this[cmd_name](origin, args);
    }
    async reload_guild_prefix() {
        let reloaded_prefixes = this.PinkFredorFirebase_instance.retrieve_collection("guilds");
        if (typeof reloaded_prefixes != "undefined") {
            this.guild_prefixes = reloaded_prefixes;
        }
    }
    async help(origin = null, args = []) {
        let help_desc = JSON.parse(fs.readFileSync("data/HelpDesc.json").toString());
        if (args[0]) {
            if (help_desc["command"][args[0]])
                origin.channel.send(new Discord.MessageEmbed().setTitle(args[0]).addFields({
                    name: "Description",
                    value: `${help_desc["command"][args[0]].desc}`,
                }, {
                    name: "Usage",
                    value: `${help_desc["command"][args[0]].usage}`,
                }));
            return;
        }
        origin.channel.send(new Discord.MessageEmbed()
            .setColor("#e9e9e9")
            .setTitle("Commands")
            .addFields(help_desc["help_page"])
            .setTimestamp()
            .setFooter("https://github.com/Tiffceet/Chat-Logger-Discord-Bot"));
    }
    async ualive(origin = null, args = []) {
        let timeout_in_ms = 50000;
        if (this.ualive_last_called_by != origin.author.id ||
            Date.now() - this.ualive_last_called_timestamp > timeout_in_ms) {
            this.ualive_last_called_by = origin.author.id;
            this.ualive_last_called_streak = 0;
        }
        if (this.ualive_last_called_streak == this.ualive_status_msg.length) {
            this.ualive_last_called_streak--;
        }
        origin.channel.send(this.ualive_status_msg[this.ualive_last_called_streak++]);
        this.ualive_last_called_timestamp = Date.now();
    }
    async prefix(origin, args = []) {
        let guilds_prefix = await this.PinkFredorFirebase_instance.retrieve_collection("guilds");
        let g_prefix = guilds_prefix.find((e) => e.id == origin.guild.id);
        if (args.length == 0) {
            if (typeof guilds_prefix !== "undefined") {
                origin.channel.send(`The prefix for this server is \`${g_prefix.content.prefix}\``);
            }
            else {
                origin.channel.send(`The prefix for this server is \`.\``);
            }
            return;
        }
        let new_prefix = args[0];
        if (typeof g_prefix !== "undefined") {
            this.PinkFredorFirebase_instance.update_document("guilds", origin.guild.id, {
                prefix: new_prefix,
                name: origin.guild.name,
            });
        }
        else {
            this.PinkFredorFirebase_instance.add_document("guilds", origin.guild.id, {
                prefix: new_prefix,
                name: origin.guild.name,
            });
        }
        origin.channel.send(`The prefix for this server had changed to \`${new_prefix}\``);
        this.reload_guild_prefix();
    }
}
exports.Miscellaneous = Miscellaneous;
//# sourceMappingURL=Miscellaneous.js.map