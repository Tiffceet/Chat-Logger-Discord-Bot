import {SongQueueItem} from "./SongQueue";
import * as Discord from "discord.js";

/**
 * Responsible to store Music Player Config
 */
export interface PlayerConfig {
    volume: number,
    shuffle: boolean,
    repeat_once: boolean,
    repeat_all: boolean,
    now_playing?: number,
    connection?: Discord.VoiceConnection
}