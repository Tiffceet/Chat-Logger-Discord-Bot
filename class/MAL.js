const fetch = require("node-fetch");
const Discord = require("discord.js");

/**
 * Class to handle all anime queries to MAL API
 * @author Looz
 * @version 1.0
 */
module.exports = class MAL {
	/**
	 * Constructor of MAL API
	 * @param {string} client_secret MAL App Client Secret
	 * @param {object} firebase_instance firebase_instance
	 */
	constructor(client_secret, firebase_instance) {
		this.PKCE =
			"kEHZHBufJgapPf1UQ0iOYuzoOU0ZrCBt6qfW8q1rVkuya7mE15GpwpbyIzIYms";
		this.client_secret = client_secret;
		this.firebase_instance = firebase_instance;
		this.init();
	}

	async init() {
		this.credentials = await this.firebase_instance.retrieve_collection(
			"mal_cred"
		);
		this.credentials = this.credentials.find((e) => e.id == "cred").content;
		this.check_token_expiry();
	}

	/**
	 * Function to check if MAL Token expired, if it expired, update automatically
	 */
	async check_token_expiry() {
		if (
			Date.now() - this.credentials.date_generated >
			this.credentials.expires_in
		) {
			this.credentials = await this.fetch_token(
				this.credentials.refresh_token,
				true
			);
			this.credentials.date_generated = Date.now();
			this.firebase_instance.update_document(
				"mal_cred",
				"cred",
				this.credentials
			);
		}
	}

	/**
	 * Generate a PKCE Code (64 in length)
	 */
	code_verifier() {
		let result = "";
		let characters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
		let charactersLength = characters.length;
		for (let i = 0; i < 64; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * charactersLength)
			);
		}
		return result;
	}

	/**
	 * console.log User Auth Code URL
	 */
	auth_code_url() {
		let url = new URL("https://myanimelist.net/v1/oauth2/authorize");

		let params = {
			response_type: "code",
			client_id: "95859b866a26c4c97135cb9db05edb03",
			state: "Request",
			code_challenge: this.PKCE,
		};

		url.search = new URLSearchParams(params).toString();

		console.log("https://myanimelist.net/v1/oauth2/authorize" + url.search);
	}

	/**
	 * Get MAL Token
	 * @param {string} code_token Can be Auth Code or Referesh Token
	 * @param {boolean} is_refresh Set this to true if code_token provided is a refresh token
	 */
	async fetch_token(code_token, is_refresh = false) {
		let url = "https://myanimelist.net/v1/oauth2/token";

		let client_id = "95859b866a26c4c97135cb9db05edb03";
		let client_secret = this.client_secret;

		const { URLSearchParams } = require("url");

		const params = new URLSearchParams();
		params.append("client_id", client_id);
		params.append("client_secret", client_secret);

		if (is_refresh) {
			params.append("grant_type", "refresh_token");
			params.append("refresh_token", code_token);
		} else {
			params.append("grant_type", "authorization_code");
			params.append("code", code_token);
		}

		params.append("code_verifier", this.PKCE);

		let HTMLResponse = await fetch(url, {
			method: "POST",
			body: params,
		});

		// console.log(HTMLResponse);

		let json_response = await HTMLResponse.json();

		return json_response;
	}

	async query_anime(query_name) {
		let return_obj = {
			status: false,
			anime_details: null,
			err: "",
        };
        
        // Always perform this check
        this.check_token_expiry();

		let url = `https://api.myanimelist.net/v2/anime?q=${query_name}&limit=4`;
		let HTMLResponse = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.credentials.access_token}`,
			},
		});

		let json_response = await HTMLResponse.json();

		if (json_response.data.length == 0) {
			return_obj.err = "Anime not found";
			return return_obj;
		}

        // console.log(json_response);

        let anime_id = json_response.data[0].node.id;
        
		url =
			`https://api.myanimelist.net/v2/anime/${anime_id}?fields=id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics`;
		HTMLResponse = await fetch(url, {
			headers: {
				Authorization: `Bearer ${this.credentials.access_token}`,
			},
        });
        
        json_response = await HTMLResponse.json();

        return_obj.anime_details = json_response;

        return_obj.status = true;
        return return_obj;
	}
};
