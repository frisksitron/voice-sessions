import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ListenerOptions } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';
import prisma from '../database';

@ApplyOptions<ListenerOptions>({
	event: Events.VoiceStateUpdate
})
export class UserSessionLifecycle extends Listener {
	public async run(oldState: VoiceState, newState: VoiceState) {
		const userId = oldState.member ? oldState.member.id : newState.member?.id;

		if (!userId) {
			return;
		}

		if (oldState && oldState.channelId) {
			const userSession = await prisma.userSession.findFirst({
				where: {
					userId: userId,
					endedAt: null,
					voiceSessionChannelId: oldState.channelId
				}
			});

			if (userSession) {
				await prisma.userSession.update({
					where: {
						id: userSession.id
					},
					data: {
						endedAt: new Date()
					}
				});
			}
		}

		if (newState && newState.channelId) {
			const voiceSession = await prisma.voiceSessionChannel.findUnique({
				where: {
					id: newState.channelId
				}
			});

			if (voiceSession) {
				await prisma.userSession.create({
					data: {
						userId: userId,
						voiceSessionChannelId: newState.channelId
					}
				});
			}
		}
	}
}
