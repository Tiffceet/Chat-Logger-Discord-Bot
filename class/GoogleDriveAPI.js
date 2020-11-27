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

		const client_id = this.credentials.web.client_id;
		const redirect_uris = this.credentials.web.redirect_uris;

		this.oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0]
		);

		this.authorize().then(
            // this.listFiles(this.oAuth2Client)
            );
	}

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
			scope: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.metadata.readonly", "https://www.googleapis.com/auth/drive.readonly","https://www.googleapis.com/auth/drive.file"],
		});
		console.log("Authorize this app by visiting this url:", authUrl);
	}
	/**
	 * Lists the names and IDs of up to 10 files.
	 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
	 */
	listFiles(auth) {
		const drive = google.drive({ version: "v3", auth });
		drive.files.list(
			{
				pageSize: 100,
				fields: "nextPageToken, files(id, name)",
			},
			(err, res) => {
				if (err)
					return console.log("The API returned an error: " + err);
				const files = res.data.files;
				if (files.length) {
					console.log("Files:");
					files.map((file) => {
						console.log(`${file.name} (${file.id})`);
					});
				} else {
					console.log("No files found.");
				}
			}
		);
    }
    
    play_music(origin) {
        let auth = this.oAuth2Client;
        const drive = google.drive({ version: "v3", auth });
        let fil_id = "124KNs98Wk_-nXWxLKEpVMFLy17bqoz67";
        drive.files.get(
            {
              fileId: fil_id,
              alt: "media"
            },
            { responseType: "stream" },
            (err, { data }) => {
              // console.log(data);
              origin.member.voice.channel
                .join()
                .then(connection => {
                  connection.play(data);
                })
                .catch(err => console.log(err));
            }
          );
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
