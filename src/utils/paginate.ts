import { MessageEmbed } from 'discord.js'

/**
 * 
 * @param interaction Interaction object
 * @param pages contents in array
 * @param page_count 
 * @param start_page (Optional) set start page; 1-indexed
 * @param embed_pagination_footer (Optional) Modify embed_pagination_footer; Only shown when pages to be sent are embeds; Default: "Page {n} of {max}"
 * @param emojiList (Optional) Emoji to use for buttons ['⏮️','⬅️','➡️','⏭️']
 * @param timeout (Optional) set how long should the bot listens for emoji changes in milliseconds; Default: 10 minute
 * @param defer_reply (Optional) set to true and the function will assume the reply is deferred (https://discordjs.guide/interactions/replying-to-slash-commands.html#deferred-responses)
 * @returns 
 */
const paginate = async (
	interaction: any, 
	pages: Array<any>, 
	start_page = 1,
	embed_pagination_footer = 'Page {n} of {max}',
	emojiList= ['⏮️','⬅️','➡️','⏭️'], 
	timeout = 600000,
	defer_reply = false) => {

	// Start Page checks
	if(start_page > pages.length || start_page < 1) {
		console.error(`Start Page must be in range ! (start_page: ${start_page}; pages.len: ${pages.length})`)
		interaction.reply('The bot is having a fever, please ask Looz to send koolaid')
		return
	}

	// Get page payload depends on the content
	const get_page_payload = (idx: number) => {
		if(pages[idx] instanceof MessageEmbed) {
			pages[idx].setFooter(embed_pagination_footer.replace('{n}', idx+1+'').replace('{max}', pages.length+''))
			return {
				embeds: [pages[idx]],
				content: null
			}
		} else {
			return {
				embeds: [],
				content: pages[idx]
			}
		}
	}

	// Sending the content
	let msg:any
	if(defer_reply) {
		msg = await interaction.editReply({...get_page_payload(start_page-1), fetchReply: true})
	} else {
		msg = await interaction.reply({...get_page_payload(start_page-1), fetchReply: true})
	}

	// Paging Logics
	let current_page = start_page
	/**
	 * Function to Dispatch Paging Action
	 * @param action Action to take
	 * @param r Reaction object
	 * @param u user object
	 */
	const dispatchPaging = (action: 'go_first' | 'go_prev' | 'go_next' | 'go_last' , r:any, u:any) => {
		if(interaction.channel.type !== 'DM') {
			r.users.remove(u.id)
		}
		switch(action) {
			case 'go_first': {
				current_page = 1
				msg.edit(get_page_payload(current_page-1))
				break
			}
			case 'go_prev': {
				if(current_page < 2) {
					return
				}
				msg.edit(get_page_payload(--current_page-1))
				break
			}
			case 'go_next': {
				if((current_page+1) > pages.length) {
					return
				}
				msg.edit(get_page_payload(current_page++))
				break
			}
			case 'go_last': {
				current_page = pages.length
				msg.edit(get_page_payload(current_page-1))
				break
			}
		}
		reset_collectors_timer()
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
		dispatchPaging('go_first', r, u)
	})
    
	const prev_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[1] && !user.bot
			},
			time: timeout
		})
	prev_collector.on('collect', (r: any, u: any) => {
		dispatchPaging('go_prev', r, u)
	})
	const next_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[2] && !user.bot
			},
			time: timeout
		})
	next_collector.on('collect', (r: any, u: any) => {
		dispatchPaging('go_next', r, u)
	})
	const end_collector = msg.createReactionCollector(
		{
			filter: (reaction:any, user:any) => {
				return reaction.emoji.name === emojiList[3] && !user.bot
			},
			time: timeout
		})
	end_collector.on('collect', (r: any,  u: any) => {
		dispatchPaging('go_last', r, u)
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