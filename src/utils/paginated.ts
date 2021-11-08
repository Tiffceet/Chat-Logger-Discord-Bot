
/**
 * 
 * @param interaction Interaction object
 * @param pages contents in array
 * @param page_count 
 * @param start_page (Optional) set start page; 1-indexed
 * @param embed_pagination_footer (Optional) Modify embed_pagination_footer; Only shown when pages to be sent are embeds; Default: "Page {n} of {max}"
 * @param emojiList (Optional) Emoji to use for buttons ['⏮️','⬅️','➡️','⏭️']
 * @param timeout (Optional) set how long should the bot listens for emoji changes in milliseconds; Default: 10 minute
 * @returns 
 */
const paginate = async (
	interaction: any, 
	pages: Array<any>, 
	start_page = 1,
	embed_pagination_footer = 'Page {n} of {max}',
	emojiList= ['⏮️','⬅️','➡️','⏭️'], 
	timeout = 600000) => {
	const msg = await interaction.reply({content: 'Something here', fetchReply: true})
	await msg.react(emojiList[0])
	await msg.react(emojiList[1])
	await msg.react(emojiList[2])
	await msg.react(emojiList[3])

	const filter = (reaction:any, user:any) => {
		return reaction.emoji.name === emojiList[0]
	}
        
	const first_collector = msg.createReactionCollector(
		{
			filter,
			time: timeout
		})
	first_collector.on('collect', (r: any) => {
		console.log('Something is collected')
	})
}

export default paginate