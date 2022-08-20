import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../database';
import { formatDistanceStrict, formatDistanceToNowStrict } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

@ApplyOptions<CommandOptions>({
  description: 'view your sessions',
})
export class UserCommand extends Command {
  public async messageRun(message: Message) {
    await send(message, 'Gathering your session data...');

    const user = message.author;

    const activeUserSession = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        endedAt: null,
      },
      include: {
        VoiceSessionChannel: true,
      },
    });

    const userSessions = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        endedAt: {
          not: null,
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 5,
      include: {
        VoiceSessionChannel: true,
      },
    });

    if (!activeUserSession && !userSessions.length) {
      return send(message, `You have no sessions.`);
    }

    let content = '';

    if (activeUserSession) {
      content += `**Active Session**\n`;
      content += `For ${formatDistanceToNowStrict(activeUserSession.startedAt)} since ${formatInTimeZone(
        activeUserSession.startedAt,
        'Europe/Oslo',
        'd. MMMM HH:mm:ss'
      )} \n`;
    }

    if (userSessions.length > 0) {
      content += `**Last 10 Sessions**\n`;
      userSessions.forEach((session) => {
        const duration = formatDistanceStrict(session.startedAt, session.endedAt!);
        const startedAtDateTz = formatInTimeZone(session.startedAt, 'Europe/Oslo', 'd. MMMM yyyy');
        const startedAtTimeTz = formatInTimeZone(session.startedAt, 'Europe/Oslo', 'HH:mm:ss');
        const endedAtTz = formatInTimeZone(session.endedAt!, 'Europe/Oslo', 'HH:mm:ss');
        content += `${startedAtDateTz} **${startedAtTimeTz} - ${endedAtTz}** (${duration})\n`;
      });
    }

    return send(message, content);
  }
}
