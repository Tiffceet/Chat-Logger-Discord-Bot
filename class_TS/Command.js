"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const fs = require("fs");
class Command {
    constructor(command_prefix = "") {
        this.command_prefix = command_prefix;
        this.command_desc = JSON.parse(fs.readFileSync("data/CommandDesc.json"));
        this.module_desc = JSON.parse(fs.readFileSync("data/ModuleDesc.json"));
    }
    async parse(cmd) {
        if (cmd == "") {
            return { is_command: false };
        }
        if (this.command_prefix != "" && !cmd.startsWith(this.command_prefix)) {
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
            module_path: this.module_desc["module"][this.command_desc["command"][cmd_name].moduleName]["modulePath"],
            module_dependency: this.module_desc["module"][this.command_desc["command"][cmd_name].moduleName].dependency,
            args_count: 0,
            args: cmd_args,
        };
    }
}
exports.Command = Command;
//# sourceMappingURL=Command.js.map