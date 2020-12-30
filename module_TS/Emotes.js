"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emotes = void 0;
class Emotes {
    constructor() {
        this._init_status = false;
        this.command_imageurl = {
            smh: "https://media1.giphy.com/media/WrP4rFrWxu4IE/source.gif",
            doubt: "https://i.kym-cdn.com/entries/icons/facebook/000/023/021/e02e5ffb5f980cd8262cf7f0ae00a4a9_press-x-to-doubt-memes-memesuper-la-noire-doubt-meme_419-238.jpg",
            rekt: "https://media.giphy.com/media/vSR0fhtT5A9by/giphy.gif",
            confuse: "https://media.giphy.com/media/1X7lCRp8iE0yrdZvwd/giphy.gif",
        };
        this._init_status = true;
    }
    _worker(origin, cmd_name, args) {
        let image_url = this.command_imageurl[cmd_name];
        if (typeof image_url === "undefined") {
            return;
        }
        this.send_image(origin, image_url);
    }
    ;
    async send_image(origin, url) {
        try {
            origin.channel.send("", {
                files: [url],
            });
        }
        catch (e) {
            console.log(e);
        }
    }
}
exports.Emotes = Emotes;
//# sourceMappingURL=Emotes.js.map