module.exports = {
	apps: [
		{
			name: 'discord-bot',
			script: './dist/index.js',
			env: {
				TOKEN: '',
				CLIENT_ID: '',
				CLIENT_SECRET: '',
				APPLICATION_ID: '',
			},
		},
	],
}
