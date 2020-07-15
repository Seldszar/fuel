const slugify = require('@sindresorhus/slugify');
const Conf = require('conf');
const {Consola, FancyReporter} = require('consola');
const exitHook = require('exit-hook');
const fs = require('fs');
const {Duration} = require('luxon');
const PubSub = require('twitchps');
const writeFileAtomic = require('write-file-atomic');

async function main() {
	const options = new Conf({
		watch: true,
		configName: 'options',
		cwd: '.',
		schema: {
			accessToken: {
				type: 'string',
				default: ''
			},
			level: {
				type: 'string',
				default: 'info'
			},
			userId: {
				type: 'string',
				default: ''
			},
			maxTime: {
				type: 'number',
				default: Infinity
			},
			offsetTime: {
				type: 'number',
				default: 0
			},
			rewards: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						title: {
							type: 'string'
						},
						time: {
							type: 'number'
						}
					},
					required: ['title', 'time']
				}
			}
		}
	});

	const consola = new Consola({
		level: options.get('level'),
		reporters: [new FancyReporter()]
	});

	const state = new Conf({
		watch: true,
		configName: 'state',
		cwd: 'data',
		schema: {
			availableTime: {
				type: 'number',
				default: 0
			},
			elapsedTime: {
				type: 'number',
				default: 0
			}
		}
	});

	if (!options.get('accessToken')) {
		console.error('Access token not found in the configuration file.');
		console.error(
			'Please fill the access token field with information from this URL: https://twitchtokengenerator.com/quick/qpAysiw5Ox'
		);

		return;
	}

	if (!options.get('userId')) {
		console.error('User ID not found in the configuration file.');
		console.error(
			'Please fill the user ID field file with information from this URL: https://twitchinsights.net/checkuser'
		);

		return;
	}

	if (!options.get('rewards')) {
		console.error('Rewards not found in the configuration file.');
		console.error(
			'Please fill the rewards field file with an array of objects with `name` and `time` properties'
		);

		return;
	}

	let lastUpdate = Date.now();
	let refreshId = null;

	const refresh = () => {
		if (refreshId) {
			clearTimeout(refreshId);
		}

		try {
			const deltaTime = Date.now() - lastUpdate;

			lastUpdate = Date.now();

			const elapsedTime = state.get('elapsedTime') + deltaTime;
			const remainingTime = Math.max(
				Math.min(options.get('offsetTime') + state.get('availableTime'), options.get('maxTime')) -
        elapsedTime,
				0
			);

			if (remainingTime > 0) {
				state.set('elapsedTime', elapsedTime);
			}

			const duration = Duration.fromMillis(remainingTime);
			const format = duration.toFormat('h:mm:ss');

			writeFileAtomic('data/files/time.txt', format);
		} catch (error) {
			consola.error(error);
		}

		setTimeout(refresh, 1000);
	};

	await fs.promises.mkdir('data/files', {
		recursive: true
	});

	const ps = new PubSub({
		// eslint-disable-next-line camelcase
		init_topics: [
			{
				topic: `channel-points-channel-v1.${options.get('userId')}`,
				token: options.get('accessToken')
			}
		]
	});

	ps.on('connected', () => {
		consola.info('Connected to Twitch PubSub service');
	});

	ps.on('disconnected', () => {
		consola.info('Disconnected from Twitch PubSub service');
	});

	ps.on('channel-points', data => {
		consola.debug('Reward redemption event received', data);

		const rewards = options.get('rewards');
		const reward = rewards.find(
			reward => reward.id === data.reward.id || slugify(reward.title) === slugify(data.reward.title)
		);

		if (reward) {
			consola.info('Reward redeemed: %s', reward.title);
			state.set('availableTime', state.get('availableTime') + reward.time);
		}
	});

	consola.info('Application ready');

	exitHook(() => {
		consola.info('Closing application...');

		if (refreshId) {
			clearTimeout(refreshId);
		}

		refreshId = null;
	});

	refresh();
}

main();
