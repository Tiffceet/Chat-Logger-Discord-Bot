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
export class PrivateMusicCollection implements ModuleInterface {
	driveapi_instance: GoogleDriveAPI;
	_init_status: boolean;
	lib_index: MusicLibraryIndex;
	song_queue: SongQueue = {};
	info_json_template: {
		name: "";
		artist: "";
		looz_desc: "";
		release_year: "";
		album_color: "";
		track: {};
	};

	info_json_track_template: {
		file_id: "";
		title: "";
		artist: "";
		looz_desc: "";
	};

	constructor(driveapi_instance: GoogleDriveAPI) {
		this.driveapi_instance = driveapi_instance;
		driveapi_instance.onReady(async (_) => {
			let idx = await this.get_music_index();
			this.lib_index = idx;
			await this.get_album_index();
			this._init_status = true;
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
	 */
	async get_album_index() {
		for (let i = 0; i < this.lib_index.album.length; i++) {
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
			let info_json = JSON.parse(fs.readFileSync(filename).toString());
			this.lib_index.album[i].info_json = info_json;
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
	 * @param {SongQueueItem} queue_item
	 */
	async play_music(origin: Discord.Message, queue_item: SongQueueItem) {
		let data_file_stream_req = await this.driveapi_instance.get_file_stream(
			queue_item.google_drive_file_id
		);
		let data_stream = data_file_stream_req.data;

		origin.member.voice.channel
			.join()
			.then((connection) => {
				origin.channel.send(this.get_now_playing_embed(queue_item));
				connection.play(data_stream).on("finish", () => {
					let next_item = this.song_queue[origin.guild.id].shift();
					if (next_item) {
						this.play_music(origin, next_item);
					} else {
						delete this.song_queue[origin.guild.id];
						this.send_disconnect_message(origin);
						origin.member.voice.channel.leave();
					}
				});
				let disp = connection.dispatcher;
				disp.setVolume(0.5);
			})
			.catch((err) => console.log(err));
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

	// =============================================================
	// Command Function
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

	async pmc_play(origin: Discord.Message, args: Array<string> = []) {
		let query = args.join(" ");

		if (!origin.member.voice.channel) {
			origin.channel.send(
				"Please enter a voice channel before using this"
			);
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

		// let track_info = music_title_library.find((v) => {
		// 	return v.title === query;
		// });

		if (!found) {
			origin.channel.send(
				"Sorry but I dont think I know what was that..."
			);
			return;
		}

		// let data_file_stream_req = await this.driveapi_instance.get_file_stream(file_id_to_play);
		// let data = data_file_stream_req.data;

		let queue_item = {
			song_title: track_info.title,
			song_artist: track_info.artist,
			song_desc: track_info.looz_desc,
			google_drive_file_id: track_info.file_id,
			album: track_info.album,
		};
		if (typeof this.song_queue[origin.guild.id] !== "undefined") {
			this.song_queue[origin.guild.id].push(queue_item);
		} else {
			this.song_queue[origin.guild.id] = [queue_item];
			this.play_music(origin, this.song_queue[origin.guild.id].shift());
		}

		origin.channel.send(
			new Discord.MessageEmbed()
				.setDescription(
					`Queued \`${track_info.title}\` by \`${track_info.artist}\` from \`${track_info.album}\``
				)
				.setColor("#a88932")
		);
	}

	async pmc_stop(origin: Discord.Message, args: Array<string> = []) {
		if (!origin.member.voice.channel) {
			origin.channel.send(
				"Sir, you have to be with the people to skip.\nYou wouldn't want a stranger stop your song isnt it."
			);
			return;
        }
        
        let member = origin.member.voice.channel.members.find(mem => {return mem.id == "697682159355428875"});
        if(typeof member === "undefined") {
            return;
        }

		delete this.song_queue[origin.guild.id];
		this.send_disconnect_message(origin);
		origin.member.voice.channel.leave();
	}

	async pmc_skip(origin: Discord.Message, args: Array<string> = []) {
		if (!origin.member.voice.channel) {
			origin.channel.send(
				"Sir, you have to be with the people to skip.\nYou wouldn't want a stranger skip your song isnt it."
			);
			return;
		}
		let playthis = this.song_queue[origin.guild.id].shift();
		if (playthis) {
			this.play_music(origin, playthis);
		} else {
			origin.member.voice.channel.leave();
		}
	}

	async pmc_config(origin: Discord.Message, args: Array<string> = []) {
		if (origin.author.id != "246239361195048960") {
			origin.channel.send("This is limited to Looz for now.");
			return;
		}
		switch (args[0]) {
			case "albuminfo":
				this.pmc_config_albuminfo(origin, args.slice(1));
				break;
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
								origin.channel.send(
									`Parsed Info:\nTitle: ${
										ret.title || "Unknown"
									}\nArtist: ${ret.artist || "Unknown"}`
								);
								editing_info_json["track"][j + 1] = {
									file_id: track_list[j].id,
									title: ret.title || "Unknown",
									artist: ret.artist || "Unknown",
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

	async pmc_reload(origin: Discord.Message, args: Array<string> = []) {
		origin.channel.send("PMC Reloading...");
		await this._reload();
		origin.channel.send("PMC Reloaded.");
	}
}
