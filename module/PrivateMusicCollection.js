/**
 * Private Music Collection where everything is stored in google drive
 * @author Looz
 * @version ∞.∞
 */
const { google } = require("googleapis");
const Discord = require("discord.js");
const ffmetadata = require("ffmetadata");
const fs = require("fs");
const Miscellaneous = require("./Miscellaneous");
const DiscordUtil = require("../util/DiscordUtil.js");
var PrivateMusicCollection = {
	// =============================================================
	// DEFAULT MODULE MEMBER
	// _module_dependency: store the class instances to be used
	// _init: To initalise this module
	// _init_status: Is this module initialised?
	// _worker: to be executed when a command comes in
	// _import: to load the class instances needed by this module
	// =============================================================
	_module_dependency: {},
	_init: function (reload = false) {
		if (reload) {
			return new Promise((resolve) => {
				PrivateMusicCollection._module_dependency[
					"GoogleDriveAPI"
				].onReady(async (_) => {
					let idx = await PrivateMusicCollection.get_music_index();
					PrivateMusicCollection.lib_index = idx;
					await PrivateMusicCollection.get_album_index();
					PrivateMusicCollection._init_status = true;
					resolve();
				});
			});
		}

		PrivateMusicCollection._module_dependency["GoogleDriveAPI"].onReady(
			async (_) => {
				let idx = await PrivateMusicCollection.get_music_index();
				PrivateMusicCollection.lib_index = idx;
				await PrivateMusicCollection.get_album_index();
				PrivateMusicCollection._init_status = true;
			}
		);
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}

		if (!PrivateMusicCollection._init_status) {
			origin.channel.send("Module is not loaded yet.");
			return;
		}

		PrivateMusicCollection[cmd_name](origin, args);
	},
	_import: function (dependency) {
		PrivateMusicCollection._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Module Vars
	// =============================================================

	/**
	 * @example
	 * {
	 *  "123456789": {
	 *      queue: [
	 *          {
	 *              song_title: "Barin-ko",
	 *              song_artist: "Kano",
	 *              album_art_drive_file_id: "1A2B3C_4D5F",
	 *              google_drive_file_id: "1A2B3C_4D5F"
	 *              data_stream: DATASTREAM // If this is possible at all
	 *          },
	 *          ...
	 *      ]
	 *  }
	 * }
	 */
	song_queue: {},

	/**
	 * @example
	 * {
	 *  album: [
	 *      {
	 *          folder_id: "5e6f7g"
	 *          name: "yuanfen",
	 *          info_json: {},
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
	lib_index: {},

	info_json_template: {
		name: "",
		artist: "",
		looz_desc: "",
		release_year: "",
		album_color: "",
		track: {},
	},

	info_json_track_template: {
		file_id: "",
		title: "",
		artist: "",
		looz_desc: "",
	},

	// =============================================================
	// =============================================================

	// =============================================================
	// Other functions
	// =============================================================

	/**
	 * Download a file into hard drive
	 * @param {string} file_id
	 * @param {string} destination
	 * @return {Promise<boolean>} true if file_id is valid
	 */
	download_file: async function (file_id, destination) {
		let data;
		try {
			data = await this._module_dependency[
				"GoogleDriveAPI"
			].get_file_stream(file_id);
			data = data.data;
		} catch (e) {
			return false;
		}

		let dest = fs.createWriteStream(destination);
		data.pipe(dest);
		await new Promise((resolve) => {
			dest.on("finish", (_) => {
				resolve("");
			});
		});
		return true;
	},

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
	get_music_index: async function () {
		let { data } = await this._module_dependency["GoogleDriveAPI"].dir();
		// Find the music folder
		let music_folder_id = data.files.find((val) => {
			return (
				val.mimeType == "application/vnd.google-apps.folder" &&
				val.name == "Music"
			);
		}).id;

		// Get all folders in Music Folder
		// Each folder represent an album
		data = await this._module_dependency["GoogleDriveAPI"].dir(
			music_folder_id
		);
		let files = data.data.files;

		let index = {
			album: [],
		};

		for (let i = 0; i < files.length; i++) {
			index["album"].push({
				folder_id: files[i].id,
				name: files[i].name,
				content: [],
			});
		}

		for (let i = 0; i < index.album.length; i++) {
			let res2 = await this._module_dependency["GoogleDriveAPI"].dir(
				index.album[i].folder_id
			);
			index.album[i].content = res2.data.files;
		}
		return index;
	},

	/**
	 * Attempt to fetch all album's info.json
	 */
	get_album_index: async function () {
		for (
			let i = 0;
			i < PrivateMusicCollection.lib_index.album.length;
			i++
		) {
			let album = PrivateMusicCollection.lib_index.album[i];
			let directory = await PrivateMusicCollection._module_dependency[
				"GoogleDriveAPI"
			].dir(album.folder_id);
			let info_file = directory.data.files.find(
				(e) => e.name == "info.json"
			);
			if (typeof info_file === "undefined") {
				continue;
			}
			let filename = `tmp/${Date.now()}`;
			await PrivateMusicCollection.download_file(info_file.id, filename);
			let info_json = JSON.parse(fs.readFileSync(filename));
			PrivateMusicCollection.lib_index.album[i].info_json = info_json;
		}
	},

	/**
	 * This function downloads the file and attempt to parse its ffmetadata (expecting mp3 file)
	 * @param {string} file_id
	 * @return {Promise<object>}
	 */
	parseSongFFMetaData: async function (file_id) {
		let filepath = `tmp/song${Date.now()}.mp3`;

		await PrivateMusicCollection.download_file(file_id, filepath);

		return await new Promise((resolve) => {
			ffmetadata.read(filepath, function (err, data) {
				resolve(data);
			});
		});
	},

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
	prepare_album_embed: async function (
		folder_id,
		cover_image_url = undefined
	) {
		// let { data } = await PrivateMusicCollection._module_dependency[
		// 	"GoogleDriveAPI"
		// ].dir(folder_id);

		// let album_art_file = data.files.find((val) => val.name == "cover.jpg");

		// let albumartfilename = `tmp/cover${Date.now()}.jpg`;

		// let attach_album_art = false;
		// let album_art_url = "";
		// if (typeof album_art_file !== "undefined") {
		// 	try {
		// 		album_art_url = await PrivateMusicCollection._module_dependency[
		// 			"GoogleDriveAPI"
		// 		].get_file_metadata(album_art_file.id, "thumbnailLink");
		// 		album_art_url = album_art_url.data.thumbnailLink;
		// 		attach_album_art = true;
		// 	} catch (e) {
		// 		console.log(e);
		// 	}
		// }

		let album_info = PrivateMusicCollection.lib_index.album.find(
			(val) => val.folder_id == folder_id
		);

		if (typeof album_info.info_json === "undefined") {
			return {
				status: false,
				err: "Missing info_json",
			};
		}
		album_info = album_info.info_json;

		let album_desc = "";
		let keys = Object.keys(album_info.track);
		for (let i = 0; i < keys.length; i++) {
			album_desc += `${keys[i]}. ${album_info.track[keys[i]].title}\n`;
		}

		let embed = new Discord.MessageEmbed()
			.setTitle(album_info.name)
			.addFields(
				{
					name: "Artist",
					value: album_info.artist || "Unknown",
					inline: true,
				},
				{
					name: "Release Year",
					value: album_info.release_year || "Unknown",
					inline: true,
				},
				{
					name: "Description",
					value: album_info.looz_desc || "Unknown",
				},
				{
					name: "Tracks",
					value: album_desc || "Unknown",
				}
			)
			.setColor(album_info.album_color);

		if (typeof cover_image_url !== "undefined") {
			embed.setThumbnail(cover_image_url);
		}

		return embed;
	},

	/**
	 * Play music into origin's channe;
	 * @param {Discord.Message} origin
	 * @param {object} queue_item
	 * @example
	 * {
	 *     song_title: "Barin-ko",
	 *     song_artist: "Kano",
	 *     album_art_drive_file_id: "1A2B3C_4D5F",
	 *     google_drive_file_id: "1A2B3C_4D5F"
	 *     data_stream: DATASTREAM // If this is possible at all
	 * },
	 */
	play_music: async function (origin, queue_item) {
		origin.member.voice.channel
			.join()
			.then((connection) => {
				connection.play(queue_item.data_stream).on("finish", () => {
					let next_item = PrivateMusicCollection.song_queue[
						origin.guild.id
					].shift();
					if (next_item) {
						PrivateMusicCollection.play_music(origin, next_item);
					} else {
						delete PrivateMusicCollection.song_queue[
							origin.guild.id
						];
						origin.member.voice.channel.leave();
					}
				});
				let disp = connection.dispatcher;
				disp.setVolume(0.5);
			})
			.catch((err) => console.log(err));
	},

	// =============================================================
	// Command Function
	// =============================================================

	pmc: async function (origin, args = []) {
		if (args.length == 0) {
			Miscellaneous.help(origin, ["pmc"]);
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
				PrivateMusicCollection.pmc_view(origin, args.slice(1));
				break;
			case "play":
				PrivateMusicCollection.pmc_play(origin, args.slice(1));
				break;
			case "reload":
				PrivateMusicCollection.pmc_reload(origin, args.slice(1));
				break;
			case "config":
				PrivateMusicCollection.pmc_config(origin, args.slice(1));
				break;
			case "skip":
				PrivateMusicCollection.pmc_skip(origin, args.slice(1));
				break;
			default:
				Miscellaneous.help(origin, ["pmc"]);
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
	},

	pmc_view: async function (origin, args = []) {
		if (args.length != 0) {
			switch (args[0]) {
				case "list":
					PrivateMusicCollection.pmc_view_list(origin, args.slice(1));
					return;
			}
		}

		let pages = [];

		let album_art = await PrivateMusicCollection._module_dependency[
			"GoogleDriveAPI"
		].search_file("name='cover.jpg'", "files(id,parents,thumbnailLink)");

		// Prepare the page
		for (
			let i = 0;
			i < PrivateMusicCollection.lib_index.album.length;
			i++
		) {
			let ab = PrivateMusicCollection.lib_index.album[i];
			let ab_art_link = album_art.data.files.find(
				(val) => val.parents[0] == ab.folder_id
			);

			ab_art_link = ab_art_link.thumbnailLink;

			let embed = await PrivateMusicCollection.prepare_album_embed(
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

		// Show the page
		DiscordUtil.paginated(
			origin,
			pages,
			PrivateMusicCollection.lib_index.album.length,
			args[0] || 1,
			"Album {n} of {max}"
		);
	},

	pmc_view_list: async function (origin, args = []) {
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
	},

	pmc_play: async function (origin, args = []) {
		let query = args.join(" ");

		if (!origin.member.voice.channel) {
			origin.channel.send(
				"Please enter a voice channel before using this"
			);
			return;
		}

		let music_title_library = [];
		for (
			let i = 0;
			i < PrivateMusicCollection.lib_index.album.length;
			i++
		) {
			let album = PrivateMusicCollection.lib_index.album[i];
			try {
				let track_keys = Object.keys(album.info_json.track);
				for (let j = 0; j < track_keys.length; j++) {
					music_title_library.push(
						album.info_json.track[track_keys[j]]
					);
				}
			} catch (e) {}
		}

		let file_id_to_play = music_title_library.find((v) => {
			return v.title === query;
		});

		if (typeof file_id_to_play === "undefined") {
			origin.channel.send(
				"Sorry but I dont think I know what was that..."
			);
			return;
		}

		file_id_to_play = file_id_to_play.file_id;

		let data = await this._module_dependency[
			"GoogleDriveAPI"
		].get_file_stream(file_id_to_play);
		data = data.data;

		let queue_item = { data_stream: data };
		if (
			typeof PrivateMusicCollection.song_queue[origin.guild.id] !==
			"undefined"
		) {
			PrivateMusicCollection.song_queue[origin.guild.id].push(queue_item);
		} else {
			PrivateMusicCollection.song_queue[origin.guild.id] = [queue_item];
			PrivateMusicCollection.play_music(
				origin,
				PrivateMusicCollection.song_queue[origin.guild.id].shift()
			);
		}
	},

	pmc_skip: async function (origin, args = []) {
		if (!origin.member.voice.channel) {
			origin.channel.send(
				"Sir, you have to be with the people to skip.\nYou wouldn't want a stranger skip your song isnt it."
			);
		}
		let playthis = PrivateMusicCollection.song_queue[
			origin.guild.id
		].shift();
		if (playthis) {
			PrivateMusicCollection.play_music(origin, playthis);
		} else {
			origin.member.voice.channel.leave();
		}
	},

	pmc_config: async function (origin, args = []) {
		if (origin.author.id != 246239361195048960) {
			origin.channel.send("This is limited to Looz for now.");
			return;
		}
		switch (args[0]) {
			case "albuminfo":
				PrivateMusicCollection.pmc_config_albuminfo(
					origin,
					args.slice(1)
				);
				break;
		}
	},

	/**
	 * A very poorly written function for looz to update album info
	 * @param {Discord.MessageEmbed} origin
	 * @param {Array} args
	 */
	pmc_config_albuminfo: async function (origin, args = []) {
		let idx = args[0] - 1;
		let album_folder_id = this.lib_index.album[idx].folder_id;
		// Attempt to download info.json
		let album_dir = await PrivateMusicCollection._module_dependency[
			"GoogleDriveAPI"
		].dir(album_folder_id);
		let info_file_details = album_dir.data.files.find(
			(val) => val.name == "info.json"
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
				JSON.stringify(PrivateMusicCollection.info_json_template)
			);
			info_json_file_id = await PrivateMusicCollection._module_dependency[
				"GoogleDriveAPI"
			].upload_file(
				"info.json",
				"application/json",
				fs.createReadStream(tmp_info_filepath),
				false,
				album_folder_id
			);
			info_json_file_id = info_json_file_id.data.id;
			origin.channel.send("File info.json created !");
		} else {
			info_json_file_id = info_file_details.id;
			await PrivateMusicCollection.download_file(
				info_json_file_id,
				tmp_info_filepath
			);
		}

		let editing_info_json = JSON.parse(fs.readFileSync(tmp_info_filepath));

		const send_editing_info_json_to_channel = function () {
			let dc_eb = new Discord.MessageEmbed();
			dc_eb.setTitle(PrivateMusicCollection.lib_index.album[idx].name);
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
            await PrivateMusicCollection._module_dependency[
                "GoogleDriveAPI"
            ].upload_file(
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
			response = await DiscordUtil.wait4Msg(origin, origin.author.id);

			if (response == "EXIT") {
				origin.channel.send("Stopped album info config");
				break;
			}

			if (response == "REVERT") {
				origin.channel.send("Reverting changes...");
				try {
					editing_info_json = JSON.parse(
						fs.readFileSync(tmp_info_filepath)
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

					response = await DiscordUtil.wait4Msg(
						origin,
						origin.author.id
					);
					let res = "";
					switch (response.split(" ")[0]) {
						case "ADD":
							origin.channel.send(
								"`.pmc IGNORE`to ignore\ntrack_no:"
							);
							let new_t_no = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
							editing_info_json["track"][new_t_no] = {
								title: "",
								artist: "",
								looz_desc: "",
							};
							origin.channel.send("title:");

							res = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][new_t_no][
									"title"
								] = res;
							}
							origin.channel.send("artist:");

							res = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][new_t_no][
									"artist"
								] = res;
							}
							origin.channel.send("looz_desc:");

							res = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
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
							res = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][t_no].title = res;
							}
							origin.channel.send(
								`old_artist: ${editing_info_json["track"][t_no].artist}`
							);
							res = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
							if (res != ".pmc IGNORE") {
								editing_info_json["track"][t_no].artist = res;
							}
							origin.channel.send(
								`old_looz_desc: ${editing_info_json["track"][t_no].looz_desc}`
							);
							res = await DiscordUtil.wait4Msg(
								origin,
								origin.author.id
							);
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
							let new_track = {};
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
								let new_t_no = await DiscordUtil.wait4Msg(
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
								(e) => e.mimeType == "audio/mpeg"
							);

							for (let j = 0; j < track_list.length; j++) {
								origin.channel.send(
									`Downloading Track ${j + 1}...`
								);
								let ret = await PrivateMusicCollection.parseSongFFMetaData(
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
				res = await DiscordUtil.wait4Msg(origin, origin.author.id);
				if (res != ".pmc IGNORE") editing_info_json[response] = res;
				else editing_info_json[response] = "";
				continue;
			} else {
				origin.channel.send(`Field "${response}" do not exist.`);
				continue;
			}
		}
	},

	pmc_reload: async function (origin, args = []) {
		origin.channel.send("PMC Reloading...");
		await PrivateMusicCollection._init(true);
		origin.channel.send("PMC Reloaded.");
	},
};

module.exports = PrivateMusicCollection;
