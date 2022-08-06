import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ListenerOptions } from '@sapphire/framework';
import type { Activity, VoiceState } from 'discord.js';
import prisma from '../lib/database';

const emojiDictionary = new Map([
	['lounge', '🍹'],
	['viewing party', '📺'],
	["vibin'", '🎧'],
	['rocket league', '🚀'],
	['7 days to die', '🧟'],
	['poker', '🃏'],
	['escape from tarkov', '🔫'],
	['pummel party', '🎉'],
	['f1 2021', '🏎'],
	['f1 2022', '🏎'],
	['factorio', '⚙️'],
	['league of legends', '️⚔️'],
	["tiny tina's wonderlands", '🌈']
]);

@ApplyOptions<ListenerOptions>({
	event: Events.VoiceStateUpdate
})
export class SessionLifecycle extends Listener {
	public async run(oldState: VoiceState, newState: VoiceState) {
		// Remove empty voice channel
		if (oldState.channel && oldState.channel.members.size <= 0) {
			const oldChannelId = oldState.channel.id;

			const session = await prisma.voiceSessionChannel.findUnique({
				where: {
					id: oldChannelId
				}
			});

			if (session) {
				await oldState.channel.delete();

				await prisma.voiceSessionChannel.update({
					where: {
						id: oldChannelId
					},
					data: {
						deleted: true,
						deletedAt: new Date()
					}
				});
			}
		}

		// Create new voice channel
		if (newState.channel) {
			const sessionCreationChannel = await prisma.sessionCreationChannel.findFirst({
				where: {
					id: newState.channel.id
				}
			});

			if (sessionCreationChannel) {
				const channel = await newState.guild.channels.fetch(sessionCreationChannel.id);
				const position = channel?.position ? (channel.position === 0 ? 1 : channel?.position) : 0;

				const newChannel = await newState.guild.channels.create('⌛ Initializing...', {
					type: 'GUILD_VOICE',
					bitrate: newState.guild.maximumBitrate,
					parent: channel?.parent?.id,
					position: position + 1
				});

				await newChannel.setPosition(position + 1, { relative: false });

				// Update database with new channel
				await prisma.voiceSessionChannel.create({
					data: {
						id: newChannel.id,
						sessionCreationChannelId: sessionCreationChannel.id
					}
				});

				// Move member to new voice channel
				await newState.member?.voice.setChannel(newChannel.id);
			}
		}

		// Rename channel
		const voiceSessions = await prisma.voiceSessionChannel.findMany({
			where: {
				deleted: false
			},
			include: {
				SessionCreationChannel: true
			}
		});

		for (const state of [oldState, newState]) {
			if (!state) {
				continue;
			}

			const voiceSession = voiceSessions.find((session) => session.id === state.channelId);

			if (!voiceSession || !state.channel) {
				continue;
			}

			const template = voiceSession.SessionCreationChannel?.template || '%emoji% %name%';
			let newChannelName = template
				.replaceAll('%emoji%', emojiDictionary.get((voiceSession.SessionCreationChannel?.fallbackName ?? 'Lounge').toLowerCase()) || '🎮')
				.replaceAll('%name%', voiceSession.SessionCreationChannel?.fallbackName ?? 'Lounge');

			if (voiceSession.SessionCreationChannel?.usePresence) {
				const activities = state.channel.members
					.map((x) => x.presence?.activities)
					.flat()
					.filter((x): x is Activity => !!x);

				const activityName = GenerateNameFromActivities(activities, voiceSession.SessionCreationChannel?.fallbackName);
				newChannelName = template
					.replaceAll('%emoji%', emojiDictionary.get(activityName.toLowerCase()) || '🎮')
					.replaceAll('%name%', activityName);
			}

			await state.channel.setName(newChannelName);
		}
	}
}

const GenerateNameFromActivities = (activities: Activity[], fallback: string | undefined): string => {
	const games = activities
		.filter((x) => x?.type === 'PLAYING')
		.map((x) => x?.name)
		.filter((x) => x !== undefined);

	const uniqueGames = [...new Set(games)];

	if (uniqueGames.length > 0) {
		return uniqueGames.join(', ');
	}

	const isStreaming = activities.some((x) => x?.type === 'STREAMING');

	if (isStreaming) {
		return 'Viewing Party';
	}

	const isListening = activities.some((x) => x?.type === 'LISTENING');

	if (isListening) {
		return "Vibin'";
	}

	return fallback ? fallback : 'Lounge';
};
