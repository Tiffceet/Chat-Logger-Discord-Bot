/**
 * Here is why I lived
 * @author Looz
 * @version ∞.∞
 */
var PrivateMusicCollection = {
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
		PrivateMusicCollection._init_status = true;
	},
	_init_status: false,
	_worker: function (origin, cmd_name, args) {
		if (origin == null) {
			return;
		}
		
	},
	_import: function (dependency) {
		PrivateMusicCollection._module_dependency = dependency;
	},
	// =============================================================
	// =============================================================

	// =============================================================
	// Command Function
	// =============================================================
}


module.exports = PrivateMusicCollection;