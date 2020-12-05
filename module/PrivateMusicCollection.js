/**
 * Here is why I lived
 * @author Looz
 * @version ∞.∞
 */
const { google } = require("googleapis");
const Discord = require("discord.js");
const fs = require("fs");
const Miscellaneous = require("./Miscellaneous");
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
				].onReady((_) => {
					PrivateMusicCollection.get_music_index().then((idx) => {
						PrivateMusicCollection.lib_index = idx;
						resolve();
					});
				});
			});
		}

		PrivateMusicCollection._module_dependency["GoogleDriveAPI"].onReady(
			(_) => {
				PrivateMusicCollection.get_music_index().then((idx) => {
					PrivateMusicCollection.lib_index = idx;
					PrivateMusicCollection._init_status = true;
				});
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
	lib_index: {},

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

	// =============================================================
	// Command Function
	// =============================================================

	pmc: async function (origin, args = []) {
		if (args.length == 0) {
			Miscellaneous.help(origin, ["pmc"]);
			// Remove this is production
			let pog = JSON.stringify(PrivateMusicCollection.lib_index);
			while (pog.length != 0) {
				origin.channel.send(pog.substring(0, 2000));
				pog = pog.substring(2000, pog.length);
			}

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
				case "album":
					PrivateMusicCollection.pmc_view_album(
						origin,
						args.slice(1)
					);
					return;
			}
		}

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

		// let item = idx.album[0].content.find((val) => {
		// 	return val.name === "info.json";
		// });

		// let item2 = idx.album[0].content.find((val) => {
		// 	return val.name === "cover.jpg";
		// });

		// let item_stream = await this._module_dependency[
		// 	"GoogleDriveAPI"
		// ].get_file_stream(item.id);

		// let item_stream2 = await this._module_dependency[
		// 	"GoogleDriveAPI"
		// ].get_file_stream(item2.id);

		// let tmp_filename = `./tmp/info${Date.now()}.json`;
		// let tmp_filename2 = `./tmp/cover${Date.now()}.jpg`;

		// let dest = fs.createWriteStream(tmp_filename);
		// item_stream.data.pipe(dest);
		// await new Promise((resolve) => {
		// 	dest.on("finish", (_) => {
		// 		resolve("");
		// 	});
		// });

		// let dest2 = fs.createWriteStream(tmp_filename2);
		// item_stream2.data.pipe(dest2);
		// await new Promise((resolve) => {
		// 	dest2.on("finish", (_) => {
		// 		resolve("");
		// 	});
		// });

		// let album_info = JSON.parse(fs.readFileSync(tmp_filename));

		// console.log(JSON.stringify(idx));

		// let album_desc = `Tracks:\n\n`;
		// for (let i = 0; i < Object.keys(album_info.track).length; i++) {
		// 	album_desc += `${i + 1}. ${album_info.track[`${i + 1}`].title}\n`;
		// }

		// origin.channel.send(
		// 	new Discord.MessageEmbed()
		// 		.setTitle(album_info.name)
		// 		.attachFiles([tmp_filename2])
		// 		.setThumbnail(`attachment://${tmp_filename2.slice(6)}`)
		// 		.setDescription(album_desc)
		// );
	},

	pmc_view_album: async function (origin, args = []) {
		let idx = args[0];
		if (isNaN(idx)) {
			origin.channel.send(
				"PMC now do not support view album by name, please use numbers for now"
			);
			return;
		}

		let { album } = PrivateMusicCollection.lib_index;
		if (idx > album.length || idx < 1) {
			origin.channel.send("Invalid index");
			return;
		}

		album = album[idx - 1];

		let { data } = await PrivateMusicCollection._module_dependency[
			"GoogleDriveAPI"
		].dir(album.folder_id);

		let info_file = data.files.find((val) => val.name == "info.json");
		let album_art_file = data.files.find((val) => val.name == "cover.jpg");

		let filename = `tmp/info${Date.now()}.json`;
		let albumartfilename = `tmp/cover${Date.now()}.jpg`;

		let dl_file_status = await PrivateMusicCollection.download_file(
			info_file.id,
			filename
		);
		let dl_file_status2 = await PrivateMusicCollection.download_file(
			album_art_file.id,
			albumartfilename
		);
		if (!dl_file_status) {
			origin.channel.send("Missing album info. Inform Looz");
			return;
		}
		if (!dl_file_status2) {
			origin.channel.send("Missing album art. Inform Looz");
			return;
		}

		let album_info = JSON.parse(fs.readFileSync(filename));

		let album_desc = `Tracks:\n\n`;
		for (let i = 0; i < Object.keys(album_info.track).length; i++) {
			album_desc += `${i + 1}. ${album_info.track[`${i + 1}`].title}\n`;
		}

		origin.channel.send(
			new Discord.MessageEmbed()
				.setTitle(album_info.name)
				.attachFiles([albumartfilename])
				.setThumbnail(`attachment://${albumartfilename.slice(4)}`)
				.setDescription(album_desc)
		);
	},

	pmc_play: async function (origin, args = []) {
		let data = await this._module_dependency[
			"GoogleDriveAPI"
		].get_file_stream(args[0]);
		data = data.data;

		origin.member.voice.channel
			.join()
			.then((connection) => {
				connection.play(data);
				let disp = connection.dispatcher;
				disp.setVolume(0.1);
			})
			.catch((err) => console.log(err));
	},

	pmc_reload: async function (origin, args = []) {
		origin.channel.send("PMC Reloading...");
		await PrivateMusicCollection._init(true);
		origin.channel.send("PMC Reloaded.");
	},
};

module.exports = PrivateMusicCollection;
