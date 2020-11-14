/**
 * Contains all functions needed to parse and process a command
 * @author Looz
 * @version 1.0
 */
const { DiscordAPIError } = require("discord.js");
const fs = require("fs");
module.exports = class Command {
	/**
	 * Initialise an instance of Command
	 * @param {string} command_prefix (optional) command prefix
	 */
	constructor(command_prefix = "") {
		this.command_prefix = command_prefix;
		this.command_desc = JSON.parse(
			// fs.readFileSync("./../data/ComamndModule.json")
			fs.readFileSync("data/CommandDesc.json")
		);
		this.module_desc = JSON.parse(fs.readFileSync("data/ModuleDesc.json"));
	}

	/**
	 * Parse a command and return info about this command
	 * @param {string} cmd Command to parse
	 * @return {Object} undefined if given text is not a command
	 * {
	 *      is_command          : boolean, // This indicates if the passed in string is indeed a command
	 *      command_name        : string,
	 *      module_name         : string,
	 *      module_path         : string,
	 *      module_dependency   : Array,
	 *      args_count          : number,
	 *      args                : Array[args_count]
	 * }
	 */
	async parse(cmd) {
		if (cmd == "") {
			// throw new Error("Command.js: Parse Error");
			return { is_command: false };
		}
		if (this.command_prefix != "" && !cmd.startsWith(this.command_prefix)) {
			// throw new Error("Command.js: Parse Error: Missing command prefix");
			return { is_command: false };
		}

		cmd = cmd.slice(this.command_prefix.length);

		cmd = cmd.match(/("[^"]+"|[\\S]+"[^"]+|[^ ]+)/gm);
		let cmd_name = cmd[0];
		let cmd_args = cmd.slice(1);

		if (typeof this.command_desc["command"][cmd_name] === "undefined") {
			return { is_command: false };
		}

		return {
			is_command: true,
			command_name: cmd_name,
			module_name: this.command_desc["command"][cmd_name].moduleName,
			module_path: this.module_desc["module"][
				this.command_desc["command"][cmd_name].moduleName
			]["modulePath"],
			module_dependency: [
				this.module_desc["module"][
					this.command_desc["command"][cmd_name].moduleName
				]["dependency"],
			],
			args_count: 0,
			args: cmd_args,
		};
	}
};
