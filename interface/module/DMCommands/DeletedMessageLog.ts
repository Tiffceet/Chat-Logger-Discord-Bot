
import * as Discord from "discord.js";
/**
 * Message Log object with key-pair as follows:
 * 
 * channel_id: discord message object
 */
export interface DeletedMessageLog {
    [key: string]: Array<Discord.Message>
}