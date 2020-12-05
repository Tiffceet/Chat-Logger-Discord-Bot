/**
 * Class to handle all transactions between google drive and this bot
 */
const fs = require("fs");
const drive_cred_path = "./drive_credentials.json";
const { google } = require("googleapis");
const { reseller } = require("googleapis/build/src/apis/reseller");
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
	 * Get directory in google drive
	 * @param {string} folder_id (optional) specific folder_id to get dir from
	 * @return {Promise<object>|Promise<boolean>} Object returned by google.drive.list, if folder_id is invalid, returns false
	 * @example
	 * {
	 *  config: {},
	 *  data: {
	 *      files: [
	 *          {
	 *              id: string,
	 *              kind: string,
	 *              mimeType: string,
	 *              name: string
	 *          },
	 *          ...
	 *      ]
	 *  },
	 *  headers: {}.
	 * }
	 */
	async dir(folder_id = undefined) {
		let auth = this.oAuth2Client;
		const drive = google.drive({ version: "v3", auth });
		let res;
		if (typeof folder_id !== "undefined") {
			try {
				res = await drive.files.list({
					q: `'${folder_id}' in parents`,
				});
			} catch (e) {
				return false;
			}
		} else {
			res = await drive.files.list();
		}
		return res;
	}

	/**
	 * Get File stream of a given file id
	 * @param {string} file_id
	 * @return {object} object returned by drive.files.get()
	 * @example
	 * {
	 *      config: {},
	 *      data: Gunzip object
	 *      headers: {}
	 * }
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

	/**
	 * Add a file to google drive
	 * @param {string} file filename or the file id
	 * @param {string} mimeType file type
	 * @param {ReadableStream} body preferbly fs.createReadStream(file) - file data to upload
	 * @param {boolean} isUpdate (optional) if set to true, assumes file id is passed in
	 * @param {string} folder_id (optional) folder to add the file to
     * @return {Promise<object>} return object if its file creation (isUpdate = false)
     * @example
	 */
	async upload_file(
		file,
		mimeType,
		body,
		isUpdate = false,
		folder_id = undefined
	) {
		let auth = this.oAuth2Client;
		const drive = google.drive({ version: "v3", auth });

		let media = {
			mimeType: mimeType,
			body: body,
		};

		if (isUpdate) {
			await drive.files.update({
				fileId: file,
				media: media,
			});
		} else {
			let resource = { name: file };
			if (typeof folder_id !== "undefined") {
				resource["parents"] = [folder_id];
			}
			return await drive.files.create({
				resource: resource,
                media: media,
                fields: 'id'
			});
		}
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
