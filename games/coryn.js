const cheerio = require("cheerio");
const fetch = require("node-fetch");
module.exports = class Coryn {
	constructor() {}

	get_exp_list_boss(lvl) {
		let $ = "";
		this.obj = { data: [] };
		fetch(`http://coryn.club/leveling.php?lv=${lvl}`)
			.then((res) => res.text())
			.then((body) => {
				$ = cheerio.load(
					body.substring(
						body.indexOf("<h3>Boss"),
						body.indexOf("<h3>Mini Boss")
					)
				);

                let table_rows = $("tbody").children();

				for (let idx = 0; idx < table_rows.length; idx++) {
					let table_datas = table_rows[idx];
					let boss_lvl = table_datas.children[0].children[0].data;
					let boss_name =
						table_datas.children[1].children[0].children[0].data;
					let boss_venue = table_datas.children[1].children[2].data;
					let boss_exp = $(
						`tbody tr:nth-of-type(${idx + 1}) td:nth-of-type(3)`
					)
						.html()
						.replaceAll("<b>", "")
						.replaceAll("</b>", "")
						.replaceAll("<small>", "")
						.replaceAll("</small>", "")
						.replaceAll("<i>", "")
						.replaceAll("</i>", "")
						.replaceAll("&#x2605;", "★")
						.replaceAll("<br>", "\n");
					// console.log(boss_lvl);
					// console.log(boss_name);
					// console.log(boss_venue);
					// console.log(boss_exp);
					this.obj.data[idx] = {
						lvl: `${boss_lvl}`,
						name: `${boss_name}`,
						venue: `${boss_venue}`,
						exp: `${boss_exp}`,
					};
                }
            });
	}
};
