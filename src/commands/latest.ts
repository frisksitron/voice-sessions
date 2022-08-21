import { Command, CommandOptions, RegisterBehavior } from '@sapphire/framework';
import prisma from '../database';
import {
  addHours,
  differenceInSeconds,
  formatDistanceStrict,
  startOfDay,
  subDays,
} from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';

export class LatestCommand extends Command {
  public constructor(context: Command.Context, options: CommandOptions) {
    super(context, {
      ...options,
      name: 'latest',
      description: 'view the latest running session for the last 3 days',
      preconditions: ['StenbergOnly'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('User to view sessions for')
              .setRequired(false)
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const user = interaction.options.getUser('user') || interaction.user;

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
      await interaction.reply({
        content: 'No sessions found',
        ephemeral: true,
      });
      return;
    }

    const sessionsLast3Days = userSessions.filter((session) => {
      const now = utcToZonedTime(new Date(), 'Europe/Oslo');
      const endUtc = new Date(session.endedAt!);
      const end = utcToZonedTime(endUtc, 'Europe/Oslo');
      const threeDaysAgo = subDays(now, 3);
      const six = addHours(startOfDay(end), 6);
      return end > threeDaysAgo && end < six;
    });

    const latestSession = sessionsLast3Days.sort((a, b) => {
      const endA = utcToZonedTime(new Date(a.endedAt!), 'Europe/Oslo');
      const endB = utcToZonedTime(new Date(b.endedAt!), 'Europe/Oslo');

      const sixA = addHours(startOfDay(endA), 6);
      const sixB = addHours(startOfDay(endB), 6);

      const diffA = differenceInSeconds(endA, sixA);
      const diffB = differenceInSeconds(endB, sixB);

      return diffB - diffA;
    });

    let content: string;

    if (latestSession.length > 0) {
      const latest = latestSession[0];
      const end = formatInTimeZone(
        latest.endedAt!,
        'Europe/Oslo',
        'd. MMMM yyyy HH:mm'
      );
      const duration = formatDistanceStrict(latest.startedAt, latest.endedAt!);
      content = `Your most Steiniest night ended **${end}** and lasted ${duration}\n`;
    } else {
      content = `No Steiny nights lately... \n`;
    }

    await interaction.reply({
      content,
      ephemeral: true,
    });
  }
}
