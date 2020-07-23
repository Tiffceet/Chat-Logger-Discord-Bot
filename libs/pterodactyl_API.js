const node = require("nodeactyl");
const ptero_client = node.Client;
const mcapi_key = process.env.PTERODACTYL_API_KEY;

module.exports = class mcserverAPI {
	constructor() {
        this.serverID = "5772e6df";
		this.READY = "READY";
		this.NOT_READY = "NOT_READY";
        this.status = this.NOT_READY;
        this.api_login();
	}

	api_login() {
		ptero_client.login(
			"https://panel.freemc.host",
			mcapi_key,
			(logged_in, msg) => {
				if (!logged_in) {
                    this.status = this.NOT_READY;
				} else {
                    this.status = this.READY;
				}
			}
		);
	}

	async getServerStatus() {
		return await ptero_client.getServerStatus(this.serverID);
    }
    
    async startServer() {
        let server_status = await this.getServerStatus();
        if (server_status == "starting")
        {
            return "The server is currently starting, please wait for 3 mintues.";
        }
        if (server_status == "on")
        {
            return "Please don't try to break the bot thanks, the server is already started."
        }
        return await ptero_client.startServer(this.serverID);
    }

    async stopServer() {
        let server_status = await this.getServerStatus();
        if (server_status == "off")
        {
            return "The server is already stopped";
        }
        return await ptero_client.stopServer(this.serverID);
    }

    async killServer() {
        return await ptero_client.killServer(this.serverID);
    }
    
};
