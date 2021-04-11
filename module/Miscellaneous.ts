/**
 * To handle all Miscellaneous Command
 * @author Looz
 * @version 1.1
 */
import * as fs from "fs";
import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";
import { PinkFredorFirebase } from "../class/PinkFredorFirebase";
import { FirebaseCollection } from "../interface/class/PinkFredorFirebase/FirebaseCollection";
const fetch = require("node-fetch");
export class Miscellaneous implements ModuleInterface {
    _init_status: boolean = false;
    _worker(origin: Discord.Message, cmd_name: string, args: string[]) {
        (this as any)[cmd_name](origin, args);
    }

    PinkFredorFirebase_instance: PinkFredorFirebase;

    constructor(
        PinkFredorFirebase_instance: PinkFredorFirebase | null = undefined
    ) {
        if (typeof PinkFredorFirebase_instance !== "undefined")
            this.PinkFredorFirebase_instance = PinkFredorFirebase_instance;
        this.reload_guild_prefix().then(() => {
            this._init_status = true;
        });
    }

    ualive_last_called_by: string | null = undefined;
    ualive_last_called_streak: number = 0;
    ualive_last_called_timestamp: number | null = undefined;
    ualive_status_msg: Array<string> = [
        "Yea, I'm here, lurking around, collecting data, bla bla bla.",
        "I know you miss me, I'm here",
        "Stop asking.",
        "I said stop",
        "I'm dead, happy now ?",
    ];
    DEFAULT_PREFIX: ".";
    guild_prefixes: FirebaseCollection[];

    // =============================================================

    // =============================================================
    // Other Functions
    // =============================================================
    async reload_guild_prefix() {
        if (typeof this.PinkFredorFirebase_instance === "undefined") {
            return;
        }
        let reloaded_prefixes = await this.PinkFredorFirebase_instance.retrieve_collection(
            "guilds"
        );

        if (typeof reloaded_prefixes !== "undefined") {
            this.guild_prefixes = reloaded_prefixes;
        }
    }
    // =============================================================
    // =============================================================

    // =============================================================
    // Command functions
    // =============================================================

    /**
     * To get help about the bot
     * @param {Discord.Message} origin origin of the command caller
     * @param {Array} args Arguments of this function
     * [
     *      command: string -- (optional) command you want specific help from
     * ]
     * @return {Discord.MessageEmbed} Discord Message Embed
     */
    async help(
        origin: Discord.Message | null = null,
        args: Array<string> = []
    ) {
        // console.log(Miscellaneous._module_dependency);
        let help_desc = JSON.parse(
            fs.readFileSync("data/HelpDesc.json").toString()
        );
        if (args[0]) {
            if (help_desc["command"][args[0]])
                (<Discord.Message>origin).channel.send(
                    new Discord.MessageEmbed().setTitle(args[0]).addFields(
                        {
                            name: "Description",
                            value: `${help_desc["command"][args[0]].desc}`,
                        },
                        {
                            name: "Usage",
                            value: `${help_desc["command"][args[0]].usage}`,
                        }
                    )
                );
            return;
        }

        // Print help page instead if the help wanted was not command-specific
        origin.channel.send(
            new Discord.MessageEmbed()
                .setColor("#e9e9e9")
                .setTitle("Commands")
                .addFields(help_desc["help_page"])
                .setTimestamp()
        );
    }
    /**
     * Fun command, ask if the bot is alive
     * @param {Discord.Message} origin origin of the command sender
     * @param {*} args No args expected
     */
    async ualive(
        origin: Discord.Message | null = null,
        args: Array<string> = []
    ) {
        let timeout_in_ms = 50000;

        if (
            this.ualive_last_called_by != origin.author.id ||
            Date.now() - this.ualive_last_called_timestamp > timeout_in_ms
        ) {
            this.ualive_last_called_by = origin.author.id;
            this.ualive_last_called_streak = 0;
        }

        if (this.ualive_last_called_streak == this.ualive_status_msg.length) {
            this.ualive_last_called_streak--;
        }
        origin.channel.send(
            this.ualive_status_msg[this.ualive_last_called_streak++]
        );
        this.ualive_last_called_timestamp = Date.now();
    }

    /**
     * Change the prefix of the server
     * @param {Discord.Message} origin origin of the command sender
     * @param {Array} args Args of this function
     * [
     *      new_prefix: (optional) string new prefix for the server
     * ]
     */
    async prefix(origin: Discord.Message, args: Array<string> = []) {
        if (
            !origin.member.hasPermission(Discord.Permissions.FLAGS.MANAGE_GUILD)
        ) {
            origin.channel.send(
                'You bad, **bad** boy.\n*Missing "Manage Server" Permission*'
            );
            return;
        }
        let guilds_prefix = await this.PinkFredorFirebase_instance.retrieve_collection(
            "guilds"
        );

        let g_prefix = guilds_prefix.find((e) => e.id == origin.guild.id);

        if (args.length == 0) {
            if (typeof guilds_prefix !== "undefined") {
                origin.channel.send(
                    `The prefix for this server is \`${g_prefix.content.prefix}\``
                );
            } else {
                origin.channel.send(`The prefix for this server is \`.\``);
            }
            return;
        }

        let new_prefix = args[0];

        if (typeof g_prefix !== "undefined") {
            await this.PinkFredorFirebase_instance.update_document(
                "guilds",
                origin.guild.id,
                {
                    prefix: new_prefix,
                    name: origin.guild.name,
                }
            );
        } else {
            await this.PinkFredorFirebase_instance.add_document(
                "guilds",
                origin.guild.id,
                {
                    prefix: new_prefix,
                    name: origin.guild.name,
                }
            );
        }
        origin.channel.send(
            `The prefix for this server had changed to \`${new_prefix}\``
        );

        this.reload_guild_prefix();
    }

    async inspireme(origin: Discord.Message, args: Array<string> = []) {
        let url = `https://inspirobot.me/api?generate=true`;
        let HTMLResponse = await fetch(url);
        let img_url = await HTMLResponse.text();
        let inspiration_embed = new Discord.MessageEmbed()
            .setTitle("InspiroBot")
			.setURL("https://inspirobot.me/")
            .setColor("#" + ((Math.random() * 0xffffff) << 0).toString(16))
            .setImage(img_url);

        origin.channel.send(inspiration_embed);
    }
    // =============================================================
    // =============================================================
}
