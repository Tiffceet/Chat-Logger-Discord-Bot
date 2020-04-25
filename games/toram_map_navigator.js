const fs = require("fs");
const path = require("path");
module.exports = class Tomana {
	constructor() {
		this.result_path = "";
		// the correct way to load relative path
		// Load sorted toram maps data
		this.raw_data = fs
			.readFileSync(
				path.resolve(__dirname, "../data/sorted_toram_maps.txt"),
				"utf-8"
			)
			.split("\n");
		this.raw_data.forEach((data, index) => {
			this.raw_data[index] = data.split("|");
		});
		this.vertices = this.raw_data.length;

		// Load link data
		this.data = fs
			.readFileSync(
				path.resolve(__dirname, "../data/map_links.txt"),
				"utf-8"
			)
			.split("\n");
		this.data.forEach((data, index) => {
			this.data[index] = data.split(" ");
		});

		// reindex the link data according to toram map data
		// Reason for this is because link data was made according to their mapID,
		// but for the alg to work, i need the actual index of that data instead of
		// id to simplify my alg
		this.data.forEach((data, index) => {
			this.data[index] = [
				this.find_idx(this.data[index][0]),
				this.find_idx(this.data[index][1]),
			];
		});

		// initalisation of global var
		this.dist = new Array(this.vertices).fill(Infinity);
		this.path_info = new Array(this.vertices).fill([-1]);
		this.visited = new Array(this.vertices).fill(false);
	}

	// used to index all the links
	find_idx(mapID) {
		for (let i = 0; i < this.raw_data.length; i++) {
			if (this.raw_data[i][0] == mapID) {
				return i;
			}
		}
	}

	// Implementation of dijkstra algorithm
	dij(s, isSource = true) {
		if (isSource) {
			// reinitailise everything
			this.result_path = "";
			this.dist = new Array(this.vertices).fill(Infinity);
			this.path_info = new Array(this.vertices).fill([-1]);
			this.visited = new Array(this.vertices).fill(false);
			this.dist[s] = 0;
			this.path_info[s] = [s];
		}
		let neighbour = [];
		this.data.forEach((data, idx) => {
			let src = parseInt(data[0]);
			let des = parseInt(data[1]);
			if (src == s) {
				// if visited before skip
				if (this.visited[des]) {
					return;
				}
				if (this.dist[src] + 1 < this.dist[des]) {
					this.dist[des] = this.dist[src] + 1;
					this.path_info[des] = this.path_info[src].slice(); // clone
					this.path_info[des].push(des);
					neighbour.push(des);
				}
			} else if (des == s) {
				if (this.visited[src]) {
					return;
				}
				if (this.dist[des] + 1 < this.dist[src]) {
					this.dist[src] = this.dist[des] + 1;
					this.path_info[src] = this.path_info[des].slice(); // clone
					this.path_info[src].push(src);
					neighbour.push(src);
				}
			}
		});

		for (let x = 0; x < neighbour.length; x++) {
			this.dij(neighbour[x], false);
		}
	}

	// Start the algorithm
	run(src_idx, des_idx) {
		this.dij(src_idx);
		this.result_path = this.path_info[des_idx].map((data) => {
			return "`" + this.raw_data[data][1] + "`";
        });
        // console.log(this.result_path.join(" --> "));
	}

	// raw_data contain all the map + id, however i had reindexed everything accoriding to their actual index from the array
	get_idx_from_name(map_name) {
		for (let i = 0; i < this.raw_data.length; i++) {
			if (this.raw_data[i][1] == map_name) {
				return i;
			}
		}
		return -1;
    }
    
    get_maplist(page_num)
    {
        if(page_num < 1 || page_num > 5)
        {
            return;
        }
        let low = (page_num - 1) * 25;
        let up =  25 * page_num;
        let out = this.raw_data.slice(low,up);
        out.forEach((data, idx)=>{
            out[idx][0] = low++;
        });
        return out;
    }
};
