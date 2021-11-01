import { CommandInteraction } from 'discord.js'
export default interface Command {
	// DiscordSlashCommandBuilder
	data: any,
	execute: (interaction: CommandInteraction) => Promise<any>,
	[key: string]: any
}