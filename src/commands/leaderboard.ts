import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../database';
import * as R from 'remeda';
import { formatDuration, intervalToDuration } from 'date-fns';
import { sum, normalize, toMilliseconds } from 'duration-fns';

@ApplyOptions<CommandOptions>({
  description: 'view leaderboard',
})
export class UserCommand extends Command {
  public async messageRun(message: Message) {
    await send(message, 'Gathering your session data...');

    const userSessions = await prisma.userSession.findMany();

    if (userSessions.length <= 0) {
      return send(message, `There are no sessions.`);
    }

    const leaderboard = R.pipe(
      userSessions,
      R.groupBy((x) => x.userId),
      R.mapKeys((x) => {
        const user = message.guild?.members.cache.get(x.toString());
        return user?.nickname ?? user?.user.username ?? 'Unknown';
      }),
      R.mapValues((sessions) => {
        const durations = sessions.map((y) => intervalToDuration({ start: y.startedAt, end: y.endedAt ?? new Date() }));
        return normalize(sum(...durations));
      })
    );

    let content = '';
    content += `**Leaderboard**\n`;
    Object.entries(leaderboard)
      .sort((a, b) => toMilliseconds(b[1]) - toMilliseconds(a[1]))
      .forEach(([user, duration], index) => {
        content += `${index + 1}. ${user} (${formatDuration(duration)})\n`;
      });

    return send(message, content);
  }
}
