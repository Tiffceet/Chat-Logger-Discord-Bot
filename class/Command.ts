/**
 * Contains all functions needed to parse and process a command
 * @author Looz
 * @version 1.1
 */
const fs = require("fs");
import { CommandInfo } from "../interface/class/Command/CommandInfo";
import { CommandDesc } from "../interface/class/Command/CommandDesc";
import { ModuleDesc } from "../interface/class/Command/ModuleDesc";
export class Command {
	command_prefix: string;
	command_desc: CommandDesc;
	module_desc: ModuleDesc;
	/**
	 * Initialise an instance of Command
	 * @param {string} command_prefix (optional) command prefix
	 */
	constructor(command_prefix: string = "") {
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
	 * @return {CommandInfo} undefined if given text is not a command
	 */
	async parse(cmd: string): Promise<CommandInfo> {
		if (cmd == "") {
			// throw new Error("Command.js: Parse Error");
			return { is_command: false };
		}
		if (this.command_prefix != "" && !cmd.startsWith(this.command_prefix)) {
			// throw new Error("Command.js: Parse Error: Missing command prefix");
			return { is_command: false };
		}

		cmd = cmd.slice(this.command_prefix.length);

		let tokenized_cmd = cmd.match(/("[^"]+"|[\\S]+"[^"]+|[^ ]+)/gm);
		let cmd_name = tokenized_cmd[0];
		let cmd_args = tokenized_cmd.slice(1);

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
			module_dependency: this.module_desc["module"][
				this.command_desc["command"][cmd_name].moduleName
			].dependency,

			args_count: 0,
			args: cmd_args,
		};
	}
}
