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
		this.client_secret = client_secret;
		this.fb_inst = firebase_instance;
		this.credentials = JSON.parse(fs.readFileSync(drive_cred_path));
		this.credentials.web.client_secret = client_secret;
	}

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 * @param {Object} credentials The authorization client credentials.
	 * @param {function} callback The callback to call with the authorized client.
	 */
	authorize(credentials, callback) {
		const {
			client_secret,
			client_id,
			redirect_uris,
		} = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0]
		);

		// Check if we have previously stored a token.
		fs.readFile(TOKEN_PATH, (err, token) => {
			if (err) return getAccessToken(oAuth2Client, callback);
			oAuth2Client.setCredentials(JSON.parse(token));
			callback(oAuth2Client);
		});
	}

	/**
	 * Get and store new token after prompting for user authorization, and then
	 * execute the given callback with the authorized OAuth2 client.
	 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
	 */
	getAuthUrl(oAuth2Client, callback) {
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
		});
		console.log("Authorize this app by visiting this url:", authUrl);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		
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
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log("Token stored to", TOKEN_PATH);
			});
			callback(oAuth2Client);
		});
    }
};
