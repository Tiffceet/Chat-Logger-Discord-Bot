export interface CommandInfo {
	/**
	 * Indicates if the passed in string is indeed a command
	 */
	is_command: boolean,
	command_name?: string,
	module_name?: string,
	module_path?: string,
	module_dependency?: Array<string>,
	args_count?: number,
	args?: Array<string>
}
