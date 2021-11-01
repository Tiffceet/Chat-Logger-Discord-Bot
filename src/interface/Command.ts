import { CommandInteraction } from 'discord.js'
export default interface Command {
    data: any,
    execute: (interaction: CommandInteraction) => Promise<any>
}