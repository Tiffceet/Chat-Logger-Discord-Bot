/**
 * Class to handle all transactions between google drive and this bot
 */
const fs = require("fs");
const drive_cred_path = "./drive_credentials.json";
const { google } = require("googleapis");
module.exports = class GoogleDriveAPI {
	/**
	 * Ctor for Google Drive API
	 * @param {string} client_secret Client secret provided in google drive api credentials.json
	 * @param {PinkFredorFirebase} firebase_instance Firebase instance (required to store token)
	 */
	constructor(client_secret, firebase_instance) {
		let resolve;
		this.ready = new Promise((res) => (resolve = res));
		this.client_secret = client_secret;
		this.fb_inst = firebase_instance;
		this.credentials = JSON.parse(fs.readFileSync(drive_cred_path));
		this.credentials.web.client_secret = client_secret;

		const client_id = this.credentials.web.client_id;
		const redirect_uris = this.credentials.web.redirect_uris;

		this.oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0]
		);

		this.authorize().then(resolve);
	}

	onReady(callback) {
		this.ready.then(callback);
	}

	/**
	 * Return a list of albums with its content's files index
	 * @return {object} music index
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
	async get_music_index() {
		let index = {
			album: [],
		};
		let auth = this.oAuth2Client;
		const drive = google.drive({ version: "v3", auth });
		let res = await drive.files.list(
			// Get folders in the "Music" Folder
			{
				q:
					"'1DeuKTBAo7JzlobaApyynTPHbTuHce7lS' in parents and mimeType='application/vnd.google-apps.folder'",
			}
		);

		for (let i = 0; i < res.data.files.length; i++) {
			index["album"].push({
				folder_id: res.data.files[i].id,
				name: res.data.files[i].name,
				content: [],
			});
		}

		for (let i = 0; i < index.album.length; i++) {
			let res2 = await drive.files.list(
				// Get folders in the "Music" Folder
				{
					q: `'${index.album[i].folder_id}' in parents`,
				}
			);

			index.album[i].content = res2.data.files;
		}
		return index;
	}

	async get_file(file_id) {
		let auth = this.oAuth2Client;
		const drive = google.drive({ version: "v3", auth });
		return drive.files.get({
			fileId: file_id,
			alt: "media",
		});
	}

	/**
	 * Get File stream of a given file id
	 * @param {string} file_id
	 * @return {object} object returned by drive.files.get()
	 */
	async get_file_stream(file_id) {
		let auth = this.oAuth2Client;
		const drive = google.drive({ version: "v3", auth });
		// drive.files.get(
		// 	{
		// 		fileId: file_id,
		// 		alt: "media",
		// 	},
		// 	{ responseType: "stream" },
		// 	callback
		// );
		return drive.files.get(
			{
				fileId: file_id,
				alt: "media",
			},
			{ responseType: "stream" }
		);
	}

	// =============================================================================================
	// Code below this points contain code for Google Drive authorization only, proceed with caution
	// =============================================================================================

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 */
	async authorize() {
		// this.getAuthUrl(this.oAuth2Client);
		// this.getAccessToken(this.oAuth2Client, "4/0AY0e-g5kfZeWsxAEpgnINQhxaz6zNlPEKrNs1WM3CcL6SpdGwf0LWY0RhCjntmSsr5zvMw");

		let token = await this.fb_inst.retrieve_collection("cred");
		token = token.find((val) => val.id === "drive_cred").content;
		this.oAuth2Client.setCredentials(token);
		// this.play_music();
	}

	/**
	 * Get and store new token after prompting for user authorization, and then
	 * execute the given callback with the authorized OAuth2 client.
	 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
	 */
	getAuthUrl(oAuth2Client, callback) {
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: [
				"https://www.googleapis.com/auth/drive",
				"https://www.googleapis.com/auth/drive.metadata.readonly",
				"https://www.googleapis.com/auth/drive.readonly",
				"https://www.googleapis.com/auth/drive.file",
			],
		});
		console.log("Authorize this app by visiting this url:", authUrl);
	}

	/**
	 * Get and store new token after prompting for user authorization, and then
	 * execute the given callback with the authorized OAuth2 client.
	 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
	 * @param {string} auth_code auth_code i got from redirected uri
	 */
	getAccessToken(oAuth2Client, auth_code) {
		oAuth2Client.getToken(auth_code, (err, token) => {
			if (err) return console.error("Error retrieving access token", err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			// fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			// 	if (err) return console.error(err);
			// 	console.log("Token stored to", TOKEN_PATH);
			// });
			this.fb_inst.update_document("cred", "drive_cred", token);
			console.log(token);
		});
	}
};
