import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";
import { DeletedMessageLog } from "./../interface/module/DMCommands/DeletedMessageLog";

/**
 * Module to handle all DM commands that will not be listed in the help page
 * @author Looz
 * @version 1.0
 */
export class DMCommands implements ModuleInterface {
    _init_status: boolean;
    private deleted_msg_log: DeletedMessageLog = {};

    constructor() {

    }

    _worker(origin: Discord.Message, cmd_name: string, args: string[]) {
        if (origin == null) {
            return;
        }
        if (origin.guild !== null) {
            // Everything here should only run if origin is a DM
            return;
        }

        // For now, only Looz can use DM Command
        if (origin.author.id !== "246239361195048960") {
            origin.channel.send("Nope, dont.");
            return;
        }

        (this as any)[cmd_name](origin, args);
    };

    log_deleted_msg(origin: Discord.Message) {
        if (origin.guild === null) {
            return;
        }

        if (!this.deleted_msg_log[origin.channel.id]) {
            this.deleted_msg_log[origin.channel.id] = [];
        }

        this.deleted_msg_log[origin.channel.id].push(origin);

        if (this.deleted_msg_log[origin.channel.id].length > 10) {
            this.deleted_msg_log[origin.channel.id].shift();
        }
    }

    // ============================================
    // Command Functions
    // ============================================

    snipe(origin: Discord.Message, args: Array<string> = []) {
        if (args.length == 0) {
            origin.channel.send("Please select a snipe target. (channel, user, server)");
            return;
        }

        switch (args[0]) {
            case "channel":
                this.snipe_channel(origin, args.slice(1));
                break;
            case "user":
                break;
            case "server":
                break;
        }
    }

    snipe_channel(origin: Discord.Message, args: Array<string> = []) {
        if (args.length == 0) {
            origin.channel.send("Please specify channel ID");
            return;
        }

        let cid = args[0];

        if (typeof this.deleted_msg_log[cid] === "undefined" || this.deleted_msg_log[cid].length == 0) {
            origin.channel.send("No messages to snipe");
            return;
        }

        let guild_name = this.deleted_msg_log[cid][0].guild.name;

        origin.channel.send("Server: " + guild_name);
        origin.channel.send(`Channel: <#${cid}>`);


        for (let i = 0; i < this.deleted_msg_log[cid].length; i++) {
            let msg_item = this.deleted_msg_log[cid][i];

            let dt = new Date(msg_item.createdTimestamp);
            let date_str = `${dt.getFullYear().toString()}-${(dt.getMonth()+1).toString()}-${dt.getDate().toString()} ${("0" + dt.getHours().toString()).slice(-2)}:${("0" + dt.getMinutes().toString()).slice(-2)}`;

            origin.channel.send(`${date_str}: <@${msg_item.author.id}> ${msg_item.content}\n`);
        }

        // origin.channel.send(new Discord.MessageEmbed().setTitle(`${guild_name}`).addFields({ name: "Channel", value: `<#${cid}>` }).setDescription(ret_msg));
    }

    // ============================================
    // ============================================

}