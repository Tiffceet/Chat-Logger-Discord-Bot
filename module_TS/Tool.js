"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tool = void 0;
const Miscellaneous_1 = require("./Miscellaneous");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { URLSearchParams } = require("url");
class Tool {
    constructor() {
        this._init_status = false;
        this._init_status = true;
    }
    _worker(origin, cmd_name, args) {
        this[cmd_name](origin, args);
    }
    async roll(origin, args = []) {
        let min = 0;
        let max = 100;
        if (args.length >= 1) {
            let substr = args[0];
            let convertedNum = parseInt(substr, 10);
            if (!isNaN(convertedNum)) {
                max = convertedNum;
            }
        }
        origin.channel.send(`<@${origin.author.id}> rolled a ${Math.floor(Math.random() * max - min)}`);
    }
    async pick(origin, args = []) {
        let memberList = origin.guild.members.cache.array().filter((mem) => {
            let bool = true;
            if (args.includes("online")) {
                bool =
                    (bool && mem.presence.status == "online") ||
                        mem.presence.status == "idle";
            }
            if (!args.includes("bot")) {
                bool = bool && !mem.user.bot;
            }
            return bool;
        });
        if (memberList.length == 0) {
            origin.channel.send("It seems like there is no one to pick from, sad.");
            return;
        }
        let pickedUser = memberList[Math.floor(Math.random() * (memberList.length - 1))]
            .user;
        origin.channel.send(`${pickedUser.username}, you have been picked !`);
    }
    async unscramble(origin, args = []) {
        if (args.length == 0) {
            new Miscellaneous_1.Miscellaneous().help(origin, ["unscramble"]);
            return;
        }
        let word = args[0];
        const params = new URLSearchParams();
        params.append("letters", word);
        params.append("dictonary", "twl");
        params.append("repeat", "no");
        let HTMLResponse = await fetch("https://wordunscrambler.me/unscramble", {
            method: "POST",
            body: params,
        });
        let body = await HTMLResponse.text();
        let $ = cheerio.load(body);
        let unscrambled_words = [];
        let answers = $("div.result .list-wrapper ul").children();
        for (let i = 0; i < answers.length; i++) {
            if (answers[i].children[0].children[0].data.trim().length !=
                word.length) {
                continue;
            }
            unscrambled_words.push(answers[i].children[0].children[0].data.trim());
        }
        if (unscrambled_words.length != 0) {
            origin.channel.send("Possible word(s): " + unscrambled_words.join(", "));
        }
        else {
            origin.channel.send(`Sorry but i could not unscramble ${word}`);
        }
    }
}
exports.Tool = Tool;
//# sourceMappingURL=Tool.js.map