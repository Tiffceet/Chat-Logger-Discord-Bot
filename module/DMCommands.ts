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
        if (origin.author.id !== "246239361195048960" && origin.author.id !== "458156833862057985") {
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
            let date_str = `${dt.getFullYear().toString()}-${("0" + (dt.getMonth()+1).toString()).slice(-2)}-${dt.getDate().toString()} ${("0" + dt.getHours().toString()).slice(-2)}:${("0" + dt.getMinutes().toString()).slice(-2)}`;

            if (msg_item.attachments.size > 0) {
                try {
                    origin.channel.send(`${date_str}: <@${msg_item.author.tag}> ${msg_item.content}(${msg_item.attachments.entries().next().value[1].proxyURL})\n`);
                } catch (e: any) {
                    origin.channel.send(`${date_str}: <@${msg_item.author.tag}> ${msg_item.content}\n`);
                }
            } else {
                origin.channel.send(`${date_str}: <@${msg_item.author.tag}> ${msg_item.content}\n`);
            }
        }
    }

    // ============================================
    // ============================================

}