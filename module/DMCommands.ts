import * as Discord from "discord.js";
import { ModuleInterface } from "./ModuleInterface";

/**
 * Module to handle all DM commands that will not be listed in the help page
 * @author Looz
 * @version 1.0
 */
export class DMCommands implements ModuleInterface {
    _init_status: boolean;

    constructor() {

    }

    _worker(origin: Discord.Message, cmd_name: string, args: string[]) {

    };

}