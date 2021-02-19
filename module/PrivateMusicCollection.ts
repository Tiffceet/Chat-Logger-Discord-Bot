/**
 * Private Music Collection where everything is stored in google drive
 * @author Looz
 * @version ∞.∞
 */
import { drive_v3, google } from "googleapis";
import * as Discord from "discord.js";
const ffmetadata = require("ffmetadata");
import * as fs from "fs";
import { Miscellaneous } from "./Miscellaneous";
import { Util } from "../class/Util";
import { GoogleDriveAPI } from "../class/GoogleDriveAPI";
import { ModuleInterface } from "./ModuleInterface";
import {
	AlbumFolderInfo,
	MusicLibraryIndex,
} from "../interface/module/PrivateMusicCollection/MusicLibraryIndex";
import {
	SongQueue,
	SongQueueItem,
} from "../interface/module/PrivateMusicCollection/SongQueue";
import { PlayerConfig } from "../interface/module/PrivateMusicCollection/PlayerConfig";
export class PrivateMusicCollection implements ModuleInterface {
	driveapi_instance: GoogleDriveAPI;
	_init_status: boolean;
	lib_index: MusicLibraryIndex;
	song_queue: SongQueue = {};
	info_json_template: any = {
		name: "",
		artist: "",
		looz_desc: "",
		release_year: "",
		album_color: "",
		track: {},
	};

	info_json_track_template: any = {
		file_id: "",
		title: "",
		artist: "",
		looz_desc: "",
	};

	DEFAULT_PLAYER_CONFIG: PlayerConfig = {
		volume: 0.5,
		shuffle: false,
		repeat_once: false,
		repeat_all: false,
	};

	/**
	 * Contain configs of player which is active
	 * Guild ID -> PlayerConfig
	 */
	ActivePlayerConfig: { [key: string]: PlayerConfig } = {};

	constructor(driveapi_instance: GoogleDriveAPI) {
		this.driveapi_instance = driveapi_instance;
		driveapi_instance.onReady(async (_) => {
			let idx = await this.get_music_index();
			this.lib_index = idx;
			await this.get_album_index(true);
			this._init_status = true;
			console.log("pmc ready");
		});
	}

	_worker(origin: Discord.Message, cmd_name: string, args: string[]) {
		if (!this._init_status) {
			origin.channel.send("Module is not loaded yet.");
			return;
		}

		(this as any)[cmd_name](origin, args);
	}

	_reload() {
		return new Promise((resolve) => {
			this.driveapi_instance.onReady(async (_) => {
				let idx = await this.get_music_index();
				this.lib_index = idx;
				await this.get_album_index();
				this._init_status = true;
				resolve("");
			});
		});
	}

	// =============================================================
	// Other functions
	// =============================================================

	/**
	 * Download a file into hard drive
	 * @param {string} file_id
	 * @param {string} destination
	 * @return {Promise<boolean>} true if file_id is valid
	 */
	async download_file(file_id: string, destination: string) {
		let data;
		try {
			data = await this.driveapi_instance.get_file_stream(file_id);
			data = data.data;
		} catch (e) {
			return false;
		}

		let dest = fs.createWriteStream(destination);
		data.pipe(dest);
		await new Promise((resolve) => {
			dest.on("finish", (_: any) => {
				resolve("");
			});
		});
		return true;
	}

	/**
	 * Return a list of albums with its content's files index
	 * @return {Promise<object>} music index
	 * @example
	 * {
	 *  album: [
	 *      {
	 *          folder_id: "5e6f7g"
	 *          name: "yuanfen"
	 *          content: [
	 *              {
	 *                  kind: "drive#file",
	 *                  id: "1a2b3c",
	 *                  name: "10.mp3"
	 *                  mimeType: "audio/mpeg"
	 *              },
	 *              ...
	 *          ]
	 *      },
	 *      ...
	 *  ]
	 * }
	 */
	async get_music_index(): Promise<MusicLibraryIndex> {
		let { data } = <any>await this.driveapi_instance.dir();
		// Find the music folder
		let music_folder_id = data.files.find((val: any) => {
			return (
				val.mimeType == "application/vnd.google-apps.folder" &&
				val.name == "Music"
			);
		}).id;

		// Get all folders in Music Folder
		// Each folder represent an album
		data = await this.driveapi_instance.dir(music_folder_id);
		let files = data.data.files;

		let index: MusicLibraryIndex = {
			album: [],
		};

		for (let i = 0; i < files.length; i++) {
			let songinfo: AlbumFolderInfo = {
				folder_id: files[i].id,
				name: files[i].name,
				content: [],
			};

			index["album"].push(songinfo);
		}

		for (let i = 0; i < index.album.length; i++) {
			let res2 = await this.driveapi_instance.dir(
				index.album[i].folder_id
			);
			index.album[i].content = (res2 as any).data.files;
		}
		return index;
	}

	/**
	 * Attempt to fetch all album's info.json
	 * @param fastload To load only the first 5 album to increase loading time of this module (debug use only)
	 */
	async get_album_index(fastload: boolean = false) {
		let max = this.lib_index.album.length;
		for (let i = 0; i < max; i++) {
			let album = this.lib_index.album[i];
			let directory = await this.driveapi_instance.dir(album.folder_id);
			let info_file = (directory as any).data.files.find(
				(e: any) => e.name == "info.json"
			);
			if (typeof info_file === "undefined") {
				continue;
			}
			let filename = `tmp/${Date.now()}`;
			await this.download_file(info_file.id, filename);
			try {
				let info_json = JSON.parse(
					fs.readFileSync(filename).toString()
				);
				this.lib_index.album[i].info_json = info_json;
			} catch (e) {
				// If downloaded json is invalid, just assume none
				continue;
			}
		}
	}

	/**
	 * This function downloads the file and attempt to parse its ffmetadata (expecting mp3 file)
	 * @param {string} file_id
	 * @return {Promise<object>}
	 */
	async parseSongFFMetaData(file_id: string): Promise<any> {
		let filepath = `tmp/song${Date.now()}.mp3`;

		await this.download_file(file_id, filepath);

		return await new Promise((resolve) => {
			ffmetadata.read(filepath, function (err: any, data: any) {
				resolve(data);
			});
		});
	}

	/**
	 * Prepare album embed
	 * @param {string} folder_id drive folder id
	 * @param {string} cover_image_url (optional) album art if available
	 * @return {Promise<Discord.MessageEmbed> | Promise<object>} Returns album embed if successful, returns status object if failed
	 * @example
	 * {
	 *      status: false,
	 *      err: "Can not find info.json from folder_id"
	 * }
	 */
	async prepare_album_embed(
		folder_id: string,
		cover_image_url: string | null = undefined
	) {
		let album_info = this.lib_index.album.find(
			(val) => val.folder_id == folder_id
		);

		if (typeof album_info.info_json === "undefined") {
			return {
				status: false,
				err: "Missing info_json",
			};
		}

		let info_json = album_info.info_json;

		let album_desc = "";
		let keys = Object.keys(info_json.track);
		for (let i = 0; i < keys.length; i++) {
			album_desc += `${keys[i]}. ${info_json.track[keys[i]].title}\n`;
		}

		let embed = new Discord.MessageEmbed()
			.setTitle(info_json.name)
			.addFields(
				{
					name: "Artist",
					value: info_json.artist || "Unknown",
					inline: true,
				},
				{
					name: "Release Year",
					value: info_json.release_year || "Unknown",
					inline: true,
				},
				{
					name: "Description",
					value: info_json.looz_desc || "Unknown",
				},
				{
					name: "Tracks",
					value: album_desc || "Unknown",
				}
			)
			.setColor(info_json.album_color);

		if (typeof cover_image_url !== "undefined") {
			embed.setThumbnail(cover_image_url);
		}

		return embed;
	}

	/**
	 * Play music into origin's channe;
	 * @param {Discord.Message} origin
	 * @param {number} queue_item
	 */
	async play_music(origin: Discord.Message, queue_item_idx: number) {
		// Get player config
		let config = this.ActivePlayerConfig[origin.guild.id];

		config.now_playing = queue_item_idx;

		let queue_item = this.song_queue[origin.guild.id].queue[queue_item_idx];

		// Fetch song file stream
		let data_file_stream_req = await this.driveapi_instance.get_file_stream(
			queue_item.google_drive_file_id
		);
		let data_stream = data_file_stream_req.data;

		origin.member.voice.channel
			.join()
			.then((connection) => {
				this.ActivePlayerConfig[
					origin.guild.id
				].connection = connection;
				// Send now playing embed
				origin.channel.send(this.get_now_playing_embed(queue_item));

				// Play data stream
				connection.play(data_stream).on("finish", () => {
					this.next_track(origin, config, queue_item_idx);
				});

				// Set the volume of dispatcher
				let disp = connection.dispatcher;
				disp.setVolume(config.volume);
			})
			.catch((err) => console.log(err));
	}

	/**
	 * Go to next track
	 * @param origin
	 * @param config Current config of the player
	 * @param queue_item The item that is currently playing
	 * @param queue_index (optional) if provided, will attempt to play the music from the queue using index
	 */
	next_track(
		origin: Discord.Message,
		config: PlayerConfig,
		queue_item_idx: number,
		queue_index = -1
	) {
		let queue_item = this.song_queue[origin.guild.id].queue[queue_item_idx];

		// queue_index is given top priority
		if (
			queue_index != -1 &&
			queue_index >= 0 &&
			queue_index <= this.song_queue[origin.guild.id].queue.length - 1
		) {
			this.play_music(origin, queue_index);
			return;
		}

		if (
			typeof this.song_queue[origin.guild.id].immediate_queue !==
				"undefined" &&
			this.song_queue[origin.guild.id].immediate_queue.length != 0
		) {
			this.play_music(
				origin,
				this.song_queue[origin.guild.id].immediate_queue.shift()
			);
			return;
		}

		if (config.repeat_once) {
			this.play_music(origin, queue_item_idx);
			return;
		}

		let next_item_idx: number;
		if (!config.shuffle) {
			// Remove first item from song queue and plays it
			next_item_idx =
				typeof this.song_queue[origin.guild.id].queue[
					queue_item_idx + 1
				] !== "undefined"
					? queue_item_idx + 1
					: -1;
		} else {
			// Pick a random queue item to play
			let min = 0;
			let max = this.song_queue[origin.guild.id].queue.length - 1;
			let idx = Math.floor(Math.random() * (max - min) + min);
			next_item_idx = idx;
			// this.song_queue[origin.guild.id].queue.splice(idx, 1);
		}

		// If next item is not found, aka reached the end of queue, restart if the config is set to repeat_all
		if (config.repeat_all && next_item_idx == -1) {
			next_item_idx = 0;
		}

		// If there is no more item to play, say goodbye and DC
		if (next_item_idx != -1) {
			this.play_music(origin, next_item_idx);
		} else {
			delete this.song_queue[origin.guild.id].queue;
			delete this.song_queue[origin.guild.id];
			delete this.ActivePlayerConfig[origin.guild.id];
			this.send_disconnect_message(origin);
			origin.member.voice.channel.leave();
		}
	}

	get_now_playing_embed(item: SongQueueItem) {
		let fields: Discord.EmbedFieldData[] = [
			{
				name: "Title",
				value: item.song_title || "-",
				inline: true,
			},
			{
				name: "Artist",
				value: item.song_artist || "-",
				inline: true,
			},
			{
				name: "Album",
				value: item.album,
			},
			{
				name: "Description",
				value: item.song_desc || "-",
			},
		];
		let embed = new Discord.MessageEmbed()
			.setColor("#34eb95")
			.setTitle("Now playing")
			.addFields(fields);
		return embed;
	}

	/**
	 * Send disconnect message to the channel
	 * @param origin
	 */
	send_disconnect_message(origin: Discord.Message) {
		origin.channel.send(
			"Bye ! Hope you had a great music session with me :3"
		);
	}

	/**
	 * Checks the member of a Discord message if he is in VC
	 * @param origin
	 * @param msg_joined (optional) if provided, the bot will reply to the origin's channel if member is in VC indeed
	 * @param msg_failed (optional) if provided, the bot will reply to the origin's channel if member is NOT in VC
	 */
	in_VC(
		origin: Discord.Message,
		msg_joined: string = "",
		msg_failed: string = ""
	) {
		if (origin.member.voice.channel) {
			if (msg_joined) {
				origin.channel.send(msg_joined);
			}
			return true;
		} else {
			if (msg_failed) {
				origin.channel.send(msg_failed);
			}
			return false;
		}
	}

	// =============================================================
	// Command Function
	// =============================================================

	// =============================================================
	// PMC main
	// =============================================================
	async pmc(origin: Discord.Message, args: Array<string> = []) {
		if (args.length == 0) {
			new Miscellaneous().help(origin, ["pmc"]);
			// Remove this is production
			// let pog = JSON.stringify(PrivateMusicCollection.lib_index);
			// while (pog.length != 0) {
			// 	origin.channel.send(pog.substring(0, 2000));
			// 	pog = pog.substring(2000, pog.length);
			// }
			// remove end here
			return;
		}

		// Pmc Sub command
		switch (args[0]) {
			case "view":
				this.pmc_view(origin, args.slice(1));
				break;
			case "play":
				this.pmc_play(origin, args.slice(1));
				break;
			case "reload":
				this.pmc_reload(origin, args.slice(1));
				break;
			case "config":
				this.pmc_config(origin, args.slice(1));
				break;
			case "skip":
				this.pmc_skip(origin, args.slice(1));
				break;
			case "stop":
				this.pmc_stop(origin, args.slice(1));
				break;
			case "q":
				this.pmc_q(origin, args.slice(1));
				break;
			case "j":
				this.pmc_j(origin, args.slice(1));
				break;
			case "jtf":
				this.pmc_jtf(origin, args.slice(1));
				break;
			default:
				new Miscellaneous().help(origin, ["pmc"]);
		}
		/**
             (err, { data }) => {
              // console.log(data);
              origin.member.voice.channel
                .join()
                .then(connection => {
                  connection.play(data);
                })
                .catch(err => console.log(err));
            }
        */
	}
	// =============================================================
	// =============================================================

	// =============================================================
	// PMC View Subcommand
	// =============================================================
	async pmc_view(origin: Discord.Message, args: Array<string> = []) {
		if (args.length != 0) {
			switch (args[0]) {
				case "list":
					this.pmc_view_list(origin, args.slice(1));
					return;
			}
		}

		let pages = [];

		let album_art = await this.driveapi_instance.search_file(
			"name='cover.jpg'",
			"files(id,parents,thumbnailLink)"
		);

		// Prepare the page
		for (let i = 0; i < this.lib_index.album.length; i++) {
			let ab = this.lib_index.album[i];
			let ab_art_link_file = album_art.data.files.find(
				(val) => val.parents[0] == ab.folder_id
			);

			let ab_art_link = ab_art_link_file.thumbnailLink;

			let embed = await this.prepare_album_embed(
				ab.folder_id,
				ab_art_link
			);

			if (embed instanceof Discord.MessageEmbed) {
				pages[i] = embed;
			} else {
				pages[i] = new Discord.MessageEmbed().setDescription(
					"Album info not ready for " + ab.name
				);
			}
		}

		// TODO: Make this better, please
		let start_page = 1;
		if (args[0]) start_page = parseInt(args[0]);

		// Show the page
		Util.paginated(
			origin,
			pages,
			this.lib_index.album.length,
			start_page,
			"Album {n} of {max}"
		);
	}

	async pmc_view_list(origin: Discord.Message, args: Array<string> = []) {
		let al_listing = "";

		for (let i = 0; i < this.lib_index.album.length; i++) {
			al_listing += `${i + 1}. ${this.lib_index.album[i].name}\n`;
		}

		origin.channel.send(
			new Discord.MessageEmbed()
				.setTitle("Albums")
				.setDescription(al_listing)
				.setColor(
					"#" + Math.floor(Math.random() * 16777215).toString(16)
				)
		);
	}
	// =============================================================
	// =============================================================

	// =============================================================
	// PMC Play Sub commands
	// =============================================================
	async pmc_play(origin: Discord.Message, args: Array<string> = []) {
		let query = args.join(" ");

		if (
			!this.in_VC(
				origin,
				"",
				"Please enter a voice channel before using this"
			)
		) {
			return;
		}

		let found = false;
		let track_info: any;
		// let music_title_library = [];
		for (let i = 0; i < this.lib_index.album.length; i++) {
			if (found) {
				break;
			}
			let album = this.lib_index.album[i];
			try {
				let track_keys = Object.keys(album.info_json.track);
				for (let j = 0; j < track_keys.length; j++) {
					// music_title_library.push(
					// 	album.info_json.track[track_keys[j]]
					// );
					let track = album.info_json.track[track_keys[j]];
					if (track.title === query) {
						track_info = track;
						track_info.album = album.name;
						found = true;
						break;
					}
				}
			} catch (e) {}
		}

		const strip_double_quote = (str: string) => {
			if (str.charAt(0) == '"' && str.charAt(str.length - 1)) {
				return {
					surrounded_by_dq: true,
					stripped_string: str.slice(1, str.length - 1),
				};
			} else {
				return {
					surrounded_by_dq: false,
					stripped_string: "",
				};
			}
		};
		let arg = "";
		let arg_parse: {
			surrounded_by_dq: boolean;
			stripped_string: string;
		};
		switch (args[0]) {
			case "all":
				if (args.length != 1) {
					break;
				}
				this.pmc_play_filtered(origin);
				return;
			case "album":
				arg = args.slice(1).join(" ");
				arg_parse = strip_double_quote(arg);
				this.pmc_play_filtered(origin, [], (val: SongQueueItem) => {
					if (arg_parse.surrounded_by_dq) {
						return val.album == arg_parse.stripped_string;
					} else return val.album.includes(arg);
				});
				return;
			case "artist":
				arg = args.slice(1).join(" ");
				arg_parse = strip_double_quote(arg);
				this.pmc_play_filtered(origin, [], (val: SongQueueItem) => {
					if (arg_parse.surrounded_by_dq) {
						return val.song_artist == arg_parse.stripped_string;
					} else return val.song_artist.includes(arg);
				});
				return;
		}

		if (!found) {
			origin.channel.send(
				"Sorry but I dont think I know what was that..."
			);
			return;
		}

		// let data_file_stream_req = await this.driveapi_instance.get_file_stream(file_id_to_play);
		// let data = data_file_stream_req.data;

		// Check if this player have active config
		if (!this.ActivePlayerConfig[origin.guild.id]) {
			this.ActivePlayerConfig[origin.guild.id] = JSON.parse(
				JSON.stringify(this.DEFAULT_PLAYER_CONFIG)
			);
		}

		let queue_item = {
			song_title: track_info.title,
			song_artist: track_info.artist,
			song_desc: track_info.looz_desc,
			google_drive_file_id: track_info.file_id,
			album: track_info.album,
		};
		if (typeof this.song_queue[origin.guild.id] !== "undefined") {
			this.song_queue[origin.guild.id] = {
				queue: [queue_item],
				immediate_queue: [],
			};
		} else {
			this.song_queue[origin.guild.id] = {
				queue: [queue_item],
				immediate_queue: [],
			};
			this.play_music(origin, 0);
		}

		origin.channel.send(
			new Discord.MessageEmbed()
				.setDescription(
					`Queued \`${track_info.title}\` by \`${track_info.artist}\` from \`${track_info.album}\``
				)
				.setColor("#a88932")
		);
	}

	/**
	 * Play all music from the index
	 * Filter the music files if needed
	 * @param origin
	 * @param args
	 * @param filter_function (optional)
	 */
	async pmc_play_filtered(
		origin: Discord.Message,
		args: Array<string> = [],
		filter_function: (val: SongQueueItem) => boolean = undefined
	) {
		if (!this.ActivePlayerConfig[origin.guild.id]) {
			this.ActivePlayerConfig[origin.guild.id] = JSON.parse(
				JSON.stringify(this.DEFAULT_PLAYER_CONFIG)
			);
		}
		// Queue everything in lib_index into queue
		if (typeof this.song_queue[origin.guild.id] === "undefined") {
			this.song_queue[origin.guild.id] = {
				queue: [],
				immediate_queue: [],
			};
		}
		for (let i = 0; i < this.lib_index.album.length; i++) {
			let album = this.lib_index.album[i];
			if (typeof album.info_json === "undefined") {
				continue;
			}
			let track_keys = Object.keys(album.info_json.track);
			for (let j = 0; j < track_keys.length; j++) {
				let track = album.info_json.track[track_keys[j]];
				let queue_item_all = {
					song_title: track.title,
					song_artist: track.artist,
					song_desc: track.looz_desc,
					google_drive_file_id: track.file_id,
					album: album.name,
				};
				if (typeof filter_function !== "undefined") {
					if (!filter_function(queue_item_all)) {
						continue;
					}
				}
				this.song_queue[origin.guild.id].queue.push(queue_item_all);
			}
		}
		this.play_music(origin, 0);
		origin.channel.send(
			new Discord.MessageEmbed()
				.setDescription("Queued ALL songs into queue.")
				.setColor("#a88932")
		);
	}
	// =============================================================
	// =============================================================

	async pmc_stop(origin: Discord.Message, args: Array<string> = []) {
		if (
			!this.in_VC(
				origin,
				"",
				"Sir, you have to be with the people to skip.\nYou wouldn't want a stranger stop your song isnt it."
			)
		) {
			return;
		}

		let member = origin.member.voice.channel.members.find((mem) => {
			return mem.id == "697682159355428875";
		});
		if (typeof member === "undefined") {
			return;
		}

		delete this.song_queue[origin.guild.id];
		delete this.ActivePlayerConfig[origin.guild.id];
		this.send_disconnect_message(origin);
		origin.member.voice.channel.leave();
	}

	async pmc_skip(origin: Discord.Message, args: Array<string> = []) {
		if (
			!this.in_VC(
				origin,
				"",
				"Sir, you have to be with the people to skip.\nYou wouldn't want a stranger skip your song isnt it."
			)
		) {
			return;
		}
		// let playthis = this.song_queue[origin.guild.id].queue.shift();
		// if (playthis) {
		// 	this.play_music(origin, playthis);
		// } else {
		// 	origin.member.voice.channel.leave();
		// }
		if (
			typeof this.ActivePlayerConfig[origin.guild.id] !== "undefined" &&
			typeof this.ActivePlayerConfig[origin.guild.id].now_playing !==
				"undefined"
		) {
			this.next_track(
				origin,
				this.ActivePlayerConfig[origin.guild.id],
				this.ActivePlayerConfig[origin.guild.id].now_playing
			);
		} else {
			origin.channel.send("There are no songs to skip.");
		}
	}

	/**
	 * View the current queue
	 * @param origin
	 * @param args
	 */
	async pmc_q(origin: Discord.Message, args: Array<string> = []) {
		let em_color = "#5762de";
		let gid = origin.guild.id;
		if (
			typeof this.song_queue[gid].queue === "undefined" ||
			this.song_queue[gid].queue.length == 0
		) {
			origin.channel.send(
				new Discord.MessageEmbed()
					.setColor(em_color)
					.setDescription("Empty Queue")
			);
			return;
		}

		let embeds: Array<Discord.MessageEmbed> = [
			new Discord.MessageEmbed().setColor(em_color),
		];

        let immediate_queue = this.song_queue[origin.guild.id].immediate_queue;
		let desc = "";
		for (let i = 0; i < this.song_queue[gid].queue.length; i++) {
			let index_on_scr = i + 1;
			if (i % 10 == 0 && i != 0) {
				embeds.push(new Discord.MessageEmbed().setColor(em_color));
				desc = "";
			}
			desc += `${index_on_scr}. \`${this.song_queue[gid].queue[i].song_title}\` - \`${this.song_queue[gid].queue[i].song_artist}\` [\`${this.song_queue[gid].queue[i].album}\`] `;
			if (i == this.ActivePlayerConfig[origin.guild.id].now_playing) {
				desc += "< Now Playing > ";
            }
            
            if(immediate_queue.includes(i)) {
                desc += `**[${immediate_queue.indexOf(i)+1}]**`;
            }
			desc += "\n\n";
			embeds[embeds.length - 1].setDescription(desc);
        }
        
        // Looping through immediate queue to add indication to final embed
        for(let i = 0; i < this.song_queue[origin.guild.id].immediate_queue.length;i++) {
            let iq_idx = this.song_queue[origin.guild.id].immediate_queue[i];
            let idx_on_embed = Math.floor(iq_idx / 10);
            let desc = embeds[idx_on_embed].description;
            desc.search(`${iq_idx+1}. `)
        }

		let start_page =
			Math.floor(
				this.ActivePlayerConfig[origin.guild.id].now_playing / 10
			) + 1;

		if (args.length != 0) {
			Util.paginated(origin, embeds, embeds.length, parseInt(args[0]));
		} else Util.paginated(origin, embeds, embeds.length, start_page);
	}

	async pmc_j(origin: Discord.Message, args: Array<string> = []) {
		try {
			let idx = parseInt(args[0]) - 1;
			try {
				this.next_track(
					origin,
					this.ActivePlayerConfig[origin.guild.id],
					this.ActivePlayerConfig[origin.guild.id].now_playing,
					idx
				);
			} catch (e) {
				origin.channel.send("Nothing to jump");
				return;
			}
		} catch (e) {
			origin.channel.send("Please provide a valid index");
			return;
		}
		let idx = parseInt(args[0]) - 1;
		origin.channel.send(
			new Discord.MessageEmbed()
				.setColor("#E4000F")
				.setDescription(
					`Jumped to ${args[0]}. \`${
						this.song_queue[origin.guild.id].queue[idx].song_title
					}\` - \`${
						this.song_queue[origin.guild.id].queue[idx].song_artist
					}\` [\`${
						this.song_queue[origin.guild.id].queue[idx].album
					}\`]`
				)
		);
	}

	async pmc_jtf(origin: Discord.Message, args: Array<string> = []) {
		if (
			!this.in_VC(
				origin,
				"",
				"Please enter a voice channel before using this"
			)
		) {
			return;
		}

		if (typeof this.ActivePlayerConfig[origin.guild.id] === "undefined") {
			origin.channel.send("Empty Queue");
			return;
		}

		let idx = parseInt(args[0]) - 1;

		if (
			typeof this.song_queue[origin.guild.id].queue[idx] === "undefined"
		) {
			origin.channel.send("Please send a valid index");
			return;
		}

		this.song_queue[origin.guild.id].immediate_queue.push(
			parseInt(args[0]) - 1
		);

		let item = this.song_queue[origin.guild.id].queue[idx];

		origin.channel.send(
			new Discord.MessageEmbed().setDescription(
				`Enqueued \`${item.song_title}\` - \`${item.song_artist}\` [\`${item.album}\`] into immediate queue`
			)
		);
	}

	// =============================================================
	// PMC Config Sub Commands
	// =============================================================

	async pmc_config(origin: Discord.Message, args: Array<string> = []) {
		if (args.length >= 1) {
			switch (args[0]) {
				case "albuminfo":
					if (origin.author.id != "246239361195048960") {
						origin.channel.send("This is limited to Looz for now.");
						return;
					}
					this.pmc_config_albuminfo(origin, args.slice(1));
					return;
				case "r1":
					this.pmc_config_r1(origin, args.slice(1));
					return;
				case "ra":
					this.pmc_config_ra(origin, args.slice(1));
					return;
				case "rd":
					this.pmc_config_rd(origin, args.slice(1));
					return;
				case "vol":
					this.pmc_config_vol(origin, args.slice(1));
					return;
			}
		}

		let embed = new Discord.MessageEmbed();
		let fields = [
			{
				name: "Repeat Once (pmc config r1)",
				value: this.ActivePlayerConfig[origin.guild.id].repeat_once
					? "ON"
					: "OFF",
				inline: true,
			},
			{
				name: "Repeat All (pmc config ra)",
				value: this.ActivePlayerConfig[origin.guild.id].repeat_once
					? "ON"
					: "OFF",
				inline: true,
			},
			{
				name: "Random (pmc config rd)",
				value: this.ActivePlayerConfig[origin.guild.id].repeat_once
					? "ON"
					: "OFF",
				inline: true,
			},
			{
				name: "Volume (pmc config vol 50)",
				value: `${
					this.ActivePlayerConfig[origin.guild.id].connection
						.dispatcher.volume * 100
				}`,
				inline: true,
			},
		];
		embed
			.setTitle("Player Configuration")
			.setColor("#BFBFBF")
			.addFields(fields);

		origin.channel.send(embed);
	}

	async pmc_config_rd(origin: Discord.Message, args: Array<string> = []) {
		if (typeof this.ActivePlayerConfig[origin.guild.id] !== "undefined") {
			this.ActivePlayerConfig[origin.guild.id].shuffle = !this
				.ActivePlayerConfig[origin.guild.id].shuffle;
			origin.channel.send(
				new Discord.MessageEmbed().setDescription(
					"Random is " +
						(this.ActivePlayerConfig[origin.guild.id].shuffle
							? "ON"
							: "OFF")
				)
			);
		} else {
			origin.channel.send("There is nothing to repeat");
		}
	}

	async pmc_config_r1(origin: Discord.Message, args: Array<string> = []) {
		if (typeof this.ActivePlayerConfig[origin.guild.id] !== "undefined") {
			this.ActivePlayerConfig[origin.guild.id].repeat_once = !this
				.ActivePlayerConfig[origin.guild.id].repeat_once;
			origin.channel.send(
				new Discord.MessageEmbed().setDescription(
					"Repeat once is " +
						(this.ActivePlayerConfig[origin.guild.id].repeat_once
							? "ON"
							: "OFF")
				)
			);
		} else {
			origin.channel.send("There is nothing to repeat");
		}
	}

	async pmc_config_vol(origin: Discord.Message, args: Array<string> = []) {
		if (!this.in_VC(origin, "", "Please join VC before doing this")) {
			return;
		}
		let vol = parseInt(args[0]);
		if (vol > 100) {
			vol = 1;
		} else if (vol < 0) {
			vol = 0;
		} else {
			vol = vol / 100;
		}
		this.ActivePlayerConfig[
			origin.guild.id
		].connection.dispatcher.setVolume(vol);
		origin.channel.send(
			new Discord.MessageEmbed()
				.setColor("#0000FF")
				.setDescription(`Player have been set to ${vol * 100}% volume`)
		);
	}

	async pmc_config_ra(origin: Discord.Message, args: Array<string> = []) {
		if (typeof this.ActivePlayerConfig[origin.guild.id] !== "undefined") {
			this.ActivePlayerConfig[origin.guild.id].repeat_all = !this
				.ActivePlayerConfig[origin.guild.id].repeat_all;
			origin.channel.send(
				new Discord.MessageEmbed().setDescription(
					"Repeat all is " +
						(this.ActivePlayerConfig[origin.guild.id].repeat_all
							? "ON"
							: "OFF")
				)
			);
		} else {
			origin.channel.send("There is nothing to repeat");
		}
	}

	/**
	 * A very poorly written function for looz to update album info
	 * @param {Discord.Message} origin
	 * @param {Array} args
	 */
	async pmc_config_albuminfo(
		origin: Discord.Message,
		args: Array<string> = []
	) {
		let idx = parseInt(args[0]) - 1;
		let album_folder_id = this.lib_index.album[idx].folder_id;
		// Attempt to download info.json
		let album_dir: any = await this.driveapi_instance.dir(album_folder_id);
		let info_file_details = album_dir.data.files.find(
			(val: any) => val.name == "info.json"
		);

		let tmp_info_filepath = `tmp/info${Date.now()}.json`;
		let info_json_file_id = "";

		// If info.json is not found, create one on drive
		if (typeof info_file_details === "undefined") {
			origin.channel.send(
				"info.json not found in album folder.\nCreating..."
			);

			fs.writeFileSync(
				tmp_info_filepath,
				JSON.stringify(this.info_json_template)
			);
			let upload_file_status = await this.driveapi_instance.upload_file(
				"info.json",
				"application/json",
				fs.createReadStream(tmp_info_filepath),
				false,
				album_folder_id
			);
			info_json_file_id = upload_file_status.data.id;
			origin.channel.send("File info.json created !");
		} else {
			info_json_file_id = info_file_details.id;
			await this.download_file(info_json_file_id, tmp_info_filepath);
		}

		let editing_info_json = JSON.parse(
			fs.readFileSync(tmp_info_filepath).toString()
		);

		let pmc_inst = this;
		const send_editing_info_json_to_channel = function () {
			let dc_eb = new Discord.MessageEmbed();
			dc_eb.setTitle(pmc_inst.lib_index.album[idx].name);
			dc_eb.addFields(
				{
					name: "name",
					value: editing_info_json.name || "null",
					inline: true,
				},
				{
					name: "artist",
					value: editing_info_json.artist || "null",
					inline: true,
				},
				{
					name: "release_year",
					value: editing_info_json.release_year || "null",
					inline: true,
				},
				{
					name: "album_color",
					value: editing_info_json.album_color || "null",
					inline: true,
				},
				{
					name: "looz_desc",
					value: editing_info_json.looz_desc || "null",
				},
				{
					name: "track",
					value:
						Object.keys(editing_info_json.track)
							.map(
								(e) =>
									e +
									". " +
									editing_info_json.track[e].title +
									" - " +
									editing_info_json.track[e].artist +
									"\n" +
									editing_info_json.track[e].looz_desc
							)
							.join("\n") || "No tracks ",
				}
			);
			origin.channel.send(dc_eb);
		};

		const update_and_upload_info_json = async () => {
			origin.channel.send("Updating info.json...");
			fs.writeFileSync(
				tmp_info_filepath,
				JSON.stringify(editing_info_json)
			);
			await pmc_inst.driveapi_instance.upload_file(
				info_json_file_id,
				"application/json",
				fs.createReadStream(tmp_info_filepath),
				true,
				album_folder_id
			);
			origin.channel.send("Album info updated !");
		};

		let response = "";
		while (true) {
			send_editing_info_json_to_channel();
			origin.channel.send(
				"Enter field to edit (UPDATE to update info, REVERT to discard changes, EXIT to stop)"
			);
			response = await Util.wait4Msg(origin, origin.author.id);

			if (response == "EXIT") {
				origin.channel.send("Stopped album info config");
				break;
			}

			if (response == "REVERT") {
				origin.channel.send("Reverting changes...");
				try {
					editing_info_json = JSON.parse(
						fs.readFileSync(tmp_info_filepath).toString()
					);
				} catch (e) {
					origin.channel.send("Failed. Please EXIT");
				}
				continue;
			}

			if (response == "UPDATE") {
				update_and_upload_info_json();
				continue;
			}

			if (editing_info_json.hasOwnProperty(response)) {
				if (response == "track") {
					origin.channel.send(
						"Enter Action (ADD, EDIT, REMOVE, REARRANGE, IMPORT_METADATA)"
					);

					response = await Util.wait4Msg(origin, origin.author.id);
					let res = "";
					switch (response.split(" ")[0]) {
						case "ADD":
							origin.channel.send(
								"`.pmc IGNORE`to ignore\ntrack_no:"
							);
							let new_t_no = await Util.wait4Msg(
								origin,
								origin.author.id
							);
							editing_info_json["track"][new_t_no] = {
								title: "",
								artist: "",
								looz_desc: "",
							};
							origin.channel.send("title:");

							res = await Util.wait4Msg(origin, origin.author.id);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][new_t_no][
									"title"
								] = res;
							}
							origin.channel.send("artist:");

							res = await Util.wait4Msg(origin, origin.author.id);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][new_t_no][
									"artist"
								] = res;
							}
							origin.channel.send("looz_desc:");

							res = await Util.wait4Msg(origin, origin.author.id);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][new_t_no][
									"looz_desc"
								] = res;
							}
							origin.channel.send(
								`Added ${new_t_no}. ${editing_info_json["track"][new_t_no]["title"]} - ${editing_info_json["track"][new_t_no]["artist"]}`
							);
							break;
						case "EDIT":
							let t_no = response.split(" ")[1];
							origin.channel.send(
								`\`.pmc IGNORE\`to ignore\nold_title: ${editing_info_json["track"][t_no].title}`
							);
							res = await Util.wait4Msg(origin, origin.author.id);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][t_no].title = res;
							}
							origin.channel.send(
								`old_artist: ${editing_info_json["track"][t_no].artist}`
							);
							res = await Util.wait4Msg(origin, origin.author.id);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][t_no].artist = res;
							}
							origin.channel.send(
								`old_looz_desc: ${editing_info_json["track"][t_no].looz_desc}`
							);
							res = await Util.wait4Msg(origin, origin.author.id);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][
									t_no
								].looz_desc = res;
							}
							origin.channel.send(
								`Edited ${t_no}. ${editing_info_json["track"][t_no]["title"]} - ${editing_info_json["track"][t_no]["artist"]}`
							);
							break;
						case "REMOVE":
							let r_t_no = response.split(" ")[1];
							origin.channel.send(
								`${r_t_no}. ${editing_info_json["track"][r_t_no].title} - ${editing_info_json["track"][r_t_no].artist} will be removed.`
							);
							delete editing_info_json["track"][r_t_no];
							break;
						case "REARRANGE":
							let kunci = Object.keys(editing_info_json["track"]);
							let new_track: { [key: string]: any } = {};
							for (let k = 0; k < kunci.length; k++) {
								origin.channel.send(
									`${
										editing_info_json["track"][kunci[k]]
											.title
									} - ${
										editing_info_json["track"][kunci[k]]
											.artist
									}\nTrack number:`
								);
								let new_t_no = await Util.wait4Msg(
									origin,
									origin.author.id
								);
								new_track[new_t_no] =
									editing_info_json.track[kunci[k]];
							}
							editing_info_json.track = new_track;
							origin.channel.send("Finished rearranging track");
							break;
						case "IMPORT_METADATA":
							origin.channel.send(
								"I will now download the tracks and attempt to read their metadata tags"
							);
							let track_list = album_dir.data.files.filter(
								(e: any) => e.mimeType == "audio/mpeg"
							);

							for (let j = 0; j < track_list.length; j++) {
								origin.channel.send(
									`Downloading Track ${j + 1}...`
								);
								let ret = await this.parseSongFFMetaData(
									track_list[j].id
								);

								if (typeof ret === "undefined") {
									ret = {
										title: "Unknown",
										artist: "Unknown",
									};
								}
								origin.channel.send(
									`Parsed Info:\nTitle: ${ret.title}\nArtist: ${ret.artist}`
								);
								editing_info_json["track"][j + 1] = {
									file_id: track_list[j].id,
									title: ret.title,
									artist: ret.artist,
									looz_desc: "",
								};
							}
							origin.channel.send("Finished parsing metadata !");
							update_and_upload_info_json();
							break;
						default:
							origin.channel.send(
								"You might want to try that again "
							);
					}
					continue;
				}
				origin.channel.send(
					`\`.pmc IGNORE\` to leave empty\nEditing "${response}"...\nOld value:\n\`\`\`${editing_info_json[response]}\`\`\`\nEnter new value: `
				);
				let res = await Util.wait4Msg(origin, origin.author.id);
				if (res != ".pmc IGNORE") editing_info_json[response] = res;
				else editing_info_json[response] = "";
				continue;
			} else {
				origin.channel.send(`Field "${response}" do not exist.`);
				continue;
			}
		}
	}

	// =============================================================
	// =============================================================

	async pmc_reload(origin: Discord.Message, args: Array<string> = []) {
		origin.channel.send("PMC Reloading...");
		await this._reload();
		origin.channel.send("PMC Reloaded.");
	}
}
