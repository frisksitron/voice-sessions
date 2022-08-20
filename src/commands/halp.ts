import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../database';
import { addHours, differenceInSeconds, formatDistanceStrict, startOfDay, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

@ApplyOptions<CommandOptions>({
  description: 'view the latest running session for the last 3 days',
})
export class UserCommand extends Command {
  public async messageRun(message: Message) {
    await send(message, 'Gathering your session data...');

    const user = message.author;

    if (user.id !== '152782597083103232') {
      return send(message, `Wait... who are you!?`);
    }

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
      include: {
        VoiceSessionChannel: true,
      },
    });

    if (userSessions.length <= 0) {
      return send(message, `You have no sessions.`);
    }

    const sessionsLast3Days = userSessions.filter((session) => {
      const end = new Date(session.endedAt!);
      const threeDaysAgo = subDays(new Date(), 3);
      const six = addHours(startOfDay(end), 6);
      return end > threeDaysAgo && end < six;
    });

    const latestSession = sessionsLast3Days.sort((a, b) => {
      const endA = new Date(a.endedAt!);
      const endB = new Date(b.endedAt!);

      const sixA = addHours(startOfDay(endA), 6);
      const sixB = addHours(startOfDay(endB), 6);

      const diffA = differenceInSeconds(endA, sixA);
      const diffB = differenceInSeconds(endB, sixB);

      return diffB - diffA;
    });

    let content: string;

    if (latestSession.length > 0) {
      const latest = latestSession[0];
      const end = formatInTimeZone(latest.endedAt!, 'Europe/Oslo', 'd. MMMM yyyy HH:mm');
      const duration = formatDistanceStrict(latest.startedAt, latest.endedAt!);
      content = `Your most Steiniest night ended **${end}** and lasted ${duration}\n`;
    } else {
      content = `You have not \n`;
    }

    return send(message, content);
  }
}
