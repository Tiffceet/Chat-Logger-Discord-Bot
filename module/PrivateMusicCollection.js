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
	_init: function () {
		let p = new Promise((resolve) => {
			while (!this._module_dependency["GoogleDriveAPI"].readyState) {
				continue;
			}
			this._module_dependency["GoogleDriveAPI"]
				.get_music_index()
				.then((idx) => {
                    PrivateMusicCollection.lib_index = idx;
                    resolve("");
				});
		});
		p.then((_) => {
			PrivateMusicCollection._init_status = true;
		});
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
        }
        
        if(!PrivateMusicCollection._init_status) {
            origin.channel.send("This module is not ready yet.");
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
	lib_index: {},

	// =============================================================
	// =============================================================

	// =============================================================
	// Command Function
	// =============================================================

	pmc: async function (origin, args = []) {
		if (args.length == 0) {
			Miscellaneous.help(origin, ["pmc"]);
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
		let al_listing = `Albums:\n\n`;

		for (let i = 0; i < this.lib_index.album.length; i++) {
			al_listing += `${i}. ${this.lib_index.album[i].name}\nBy: ${this.lib_index.album[i].artist}\n\n`;
		}

		origin.channel.send(
			new Discord.MessageEmebed()
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
};

module.exports = PrivateMusicCollection;
