import {Message} from 'discord.js';
export interface ModuleInterface {
    _init_status: boolean,

    /**
     * Function to handle the message coming from the user
     */
    _worker: (origin:Message, cmd_name:string, args:Array<string>) => void
}