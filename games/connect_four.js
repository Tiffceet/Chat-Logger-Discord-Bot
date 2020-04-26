module.exports = class ConnectFour {
	// Start a game upon class construction
	constructor(p1, p1_name, p2, p2_name, ch) {
		this.turn = 1; // to keep track of whose turn is it
		this.p1 = p1;
		this.p1_name = p1_name;
		this.p2 = p2;
		this.p2_name = p2_name;
		this.ch = ch;
		this.grid = "";
		this.resetGrid();
	}

	getStat() {
		let txt = "";
		for (let a = 0; a < 6; a++) {
			for (let b = 0; b < 7; b++) {
				txt = txt + this.grid[a][b];
			}
		}
		return txt;
	}

	resetGrid() {
		this.grid = [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
		];
	}

	// place a piece in that col
	// if that col is not placeable, this will raise exception
	play(col) {
		if (col > 6 || col < 0) {
			throw new Error("Col out of range");
		}
		for (let i = 5; i >= 0; i--) {
			if (this.grid[i][col] === 0) {
				this.grid[i][col] = this.turn;
				// flip turns after each piece is placed
				this.turn = this.turn == 1 ? 2 : 1;
				return;
			}
		}
		throw new Error("This col is filled.");
	}

	// print grid using discord's emoji
	getGridInEmoji() {
		let grid_msg = ":one::two::three::four::five::six::seven:\n";
		for (let a = 0; a < 6; a++) {
			for (let b = 0; b < 7; b++) {
				if (this.grid[a][b] == 0) {
					grid_msg = grid_msg + ":black_large_square:";
				} else if (this.grid[a][b] == 1) {
					grid_msg = grid_msg + ":o:";
				} else if (this.grid[a][b] == 2) {
					grid_msg = grid_msg + ":x:";
				}
			}
			grid_msg = grid_msg + "\n";
		}
		return grid_msg;
	}

	// check if anyone is winning
	checkGrid() {
		let a_lim = 6;
		let b_lim = 7;
		for (let a = 0; a < 6; a++) {
			for (let b = 0; b < 7; b++) {
				if (a - 3 >= 0 && b + 3 < b_lim) {
					if (
						[
							this.grid[a][b],
							this.grid[a - 1][b + 1],
							this.grid[a - 2][b + 2],
							this.grid[a - 3][b + 3],
						].every((val, i, arr) => val === this.grid[a][b]) &&
						this.grid[a][b] != 0
					) {
						return this.grid[a][b];
					}
                }
                // left top
				if (a - 3 >= 0 && b - 3 >= 0) {
                    // console.log(`${a} ${b}`);
					if (
						[
							this.grid[a][b],
							this.grid[a - 1][b - 1],
							this.grid[a - 2][b - 2],
							this.grid[a - 3][b - 3],
						].every((val, i, arr) => val === this.grid[a][b]) &&
						this.grid[a][b] != 0
					) {
						return this.grid[a][b];
					}
				}

				if (a - 3 >= 0) {
					if (
						[
							this.grid[a][b],
							this.grid[a - 1][b],
							this.grid[a - 2][b],
							this.grid[a - 3][b],
						].every((val, i, arr) => val === this.grid[a][b]) &&
						this.grid[a][b] != 0
					) {
						return this.grid[a][b];
					}
				}
				if (b + 3 < b_lim) {
					if (
						[
							this.grid[a][b],
							this.grid[a][b + 1],
							this.grid[a][b + 2],
							this.grid[a][b + 3],
						].every((val, i, arr) => val === this.grid[a][b]) &&
						this.grid[a][b] != 0
					) {
						return this.grid[a][b];
					}
				}
			}
		}
		return -1;
	}

	is_full() {
		for (let a = 0; a < 6; a++) {
			for (let b = 0; b < 7; b++) {
				if (this.grid[a][b] == 0) {
					return false;
				}
			}
		}
		return true;
	}

	best_move() {
		const backup_grid = this.grid.map((inner) => inner.slice());
		let tmp_grid = this.grid.map((inner) => inner.slice());
		let place_piece = (col) => {
			for (let i = 5; i >= 0; i--) {
				if (tmp_grid[i][col] === 0) {
					tmp_grid[i][col] = this.turn == 1 ? 2 : 1;
					return;
				}
			}
		};

		let custom_check_grid = (gr) => {
			this.grid = gr.map((inner) => inner.slice());
			let result = this.checkGrid();
			this.grid = backup_grid.map((inner) => inner.slice());
			return result;
		};

		for (let a = 0; a < 7; a++) {
			place_piece(a);
			if (custom_check_grid(tmp_grid) != -1) {
				this.grid = backup_grid.map((inner) => inner.slice());
				return a;
			}
			tmp_grid = backup_grid.map((inner) => inner.slice());
		}
		this.grid = backup_grid.map((inner) => inner.slice());

		// Need to make sure the col is placeable
		let placeable_col = [];
		for (let a = 0; a < 6; a++) {
			if (this.grid[0][a] == 0) {
				placeable_col.push(a);
			}
		}
		return placeable_col[
			Math.round(Math.random() * (placeable_col.length - 1))
		];
	}
};
