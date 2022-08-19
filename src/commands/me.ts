import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../database';
import { formatDistanceStrict, formatDistanceToNowStrict } from 'date-fns';

@ApplyOptions<CommandOptions>({
	description: 'view your sessions'
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		await send(message, 'Gathering your session data...');

		const user = message.author;

		const activeUserSession = await prisma.userSession.findFirst({
			where: {
				userId: user.id,
				endedAt: null
			},
			include: {
				VoiceSessionChannel: true
			}
		});

		const userSessions = await prisma.userSession.findMany({
			where: {
				userId: user.id,
				endedAt: {
					not: null
				}
			},
			include: {
				VoiceSessionChannel: true
			}
		});

		if (!activeUserSession && !userSessions.length) {
			return send(message, `You have no sessions.`);
		}

		let content = '';

		if (activeUserSession) {
			content += `**Active Session**\n`;
			content += `Duration: ${formatDistanceToNowStrict(activeUserSession.startedAt)}\n`;
		}

		if (userSessions.length > 0) {
			content += `**Past Sessions**\n`;
			userSessions.forEach((session, index) => {
				content += `Session ${index}: ${formatDistanceStrict(session.startedAt, session.endedAt!)}\n`;
			});
		}

		return send(message, content);
	}
}
