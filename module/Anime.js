/**
 * Handles all command related to anime
 */
var Anime = {
	// =============================================================
	// DEFAULT MODULE MEMBER
	// _module_dependency: store the class instances to be used
	// _init: To initalise this module
	// _init_status: Is this module initialised?
	// _worker: to be executed when a command comes in
	// _import: to load the class instances needed by this module
	// =============================================================
	_module_dependency: {},
	_init: async function () {
		Anime._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}
		Anime[cmd_name](origin, args);
	},
	_import: function (dependency) {
		Anime._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Other functions
	// =============================================================
	initcap: function (string) {
		if (typeof string !== "string") return "";
		return s.charAt(0).toUpperCase() + string.slice(1);
	},

	// =============================================================
	// =============================================================

	// =============================================================
	// Command functions
	// =============================================================


	// =============================================================
	// =============================================================
};

module.exports = Anime;
