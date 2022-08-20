import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ListenerOptions } from '@sapphire/framework';
import { intervalToDuration, subDays } from 'date-fns';
import type { VoiceState } from 'discord.js';
import { toMinutes } from 'duration-fns';
import prisma from '../database';

const rolesDictionary = new Map([
	[{ minutes: 5 }, '1010462867360841778'],
	[{ minutes: 60 }, '1010463170009251850'],
	[{ minutes: 420 }, '1010461693777821696']
]);

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
			// End session
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

			const userSessions = await prisma.userSession.findMany({
				where: {
					userId: userId,
					endedAt: {
						not: null
					}
				}
			});

			// Update user role
			const member = await newState.guild.members.fetch(userId);

			console.log('member', member);

			if (member.manageable) {
				console.log('member is manageable');

				const lastWeek = subDays(new Date(), 7);
				const lastWeekSessions = userSessions.filter((session) => session.startedAt > lastWeek);

				const totalMinutes = lastWeekSessions.reduce((total, session) => {
					const duration = intervalToDuration({
						start: session.startedAt,
						end: session.endedAt!
					});
					return total + toMinutes(duration);
				}, 0);

				const role = [...rolesDictionary.entries()]
					.filter(([duration]) => totalMinutes >= toMinutes(duration))
					.sort(([keyA], [keyB]) => toMinutes(keyB) - toMinutes(keyA))[0];

				if (role) {
					const roleObject = await newState.guild.roles.fetch(role[1]);

					if (roleObject) {
						const rolesToRemove = member.roles.cache.filter((role) => role.id !== roleObject.id);
						await member.roles.remove(rolesToRemove);
						await member.roles.member.roles.set([roleObject]);
					}
				} else {
					await member.roles.remove([...rolesDictionary.values()]);
				}
			}
		}

		if (newState && newState.channelId) {
			const voiceSession = await prisma.voiceSessionChannel.findUnique({
				where: {
					id: newState.channelId
				}
			});

			if (voiceSession) {
				// End existing sessions
				const userSession = await prisma.userSession.findMany({
					where: {
						userId: userId,
						endedAt: null
					}
				});

				if (userSession.length > 0) {
					await prisma.userSession.updateMany({
						where: {
							userId: userId,
							endedAt: null
						},
						data: {
							endedAt: new Date()
						}
					});
				}

				// Create new session
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
