
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

	// Start Page checks
	if(start_page > pages.length || start_page < 1) {
		console.error(`Start Page must be in range ! (start_page: ${start_page}; pages.len: ${pages.length})`)
		interaction.reply('The bot is having a fever, please ask Looz to send koolaid')
		return
	}

	// Sending the content
	const msg = await interaction.reply({content: pages[start_page-1], fetchReply: true})

	// Paging Logics
	let current_page = start_page
	const go_first_page = () => {
		current_page = 1
		msg.edit(pages[current_page-1])
	}

	const go_prev_page = () => {
		if(current_page < 2) {
			return
		}
		msg.edit(pages[--current_page-1])
	}
    
	const go_next_page = () => {
		if((current_page+1) > pages.length) {
			return
		}
		msg.edit(pages[current_page++])
	}

	const go_last_page = () => {
		current_page = pages.length
		msg.edit(pages[current_page-1])
	}

	// Emoji collectors
	const first_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[0] && !user.bot
			},
			time: timeout
		})
	first_collector.on('collect', (r: any, u: any) => {
		// console.log('first is collected')
		r.users.remove(u.id)
		go_first_page()
		reset_collectors_timer()
	})
    
	const prev_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[1] && !user.bot
			},
			time: timeout
		})
	prev_collector.on('collect', (r: any, u: any) => {
		// console.log('prev is collected')
		r.users.remove(u.id)
		go_prev_page()
		reset_collectors_timer()
	})
	const next_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[2] && !user.bot
			},
			time: timeout
		})
	next_collector.on('collect', (r: any, u: any) => {
		// console.log('next is collected')
		r.users.remove(u.id)
		go_next_page()
		reset_collectors_timer()
	})
	const end_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[3] && !user.bot
			},
			time: timeout
		})
	end_collector.on('collect', (r: any,  u: any) => {
		// console.log('end is collected')
		r.users.remove(u.id)
		go_last_page()
		reset_collectors_timer()
	})

	const reset_collectors_timer = () => {
		first_collector.resetTimer()
		prev_collector.resetTimer()
		next_collector.resetTimer()
		end_collector.resetTimer()
	}

	await msg.react(emojiList[0])
	await msg.react(emojiList[1])
	await msg.react(emojiList[2])
	await msg.react(emojiList[3])
}

export default paginate