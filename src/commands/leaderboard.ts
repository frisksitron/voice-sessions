import { Command, RegisterBehavior } from '@sapphire/framework';
import prisma from '../database';
import * as R from 'remeda';
import { formatDuration, intervalToDuration } from 'date-fns';
import { sum, normalize, toMilliseconds } from 'duration-fns';

export class LeaderboardCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'leaderboard',
      description: 'view leaderboard',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const userSessions = await prisma.userSession.findMany({
      where: {
        VoiceSessionChannel: {
          is: {
            SessionCreationChannel: {
              is: {
                Guild: {
                  is: {
                    id: interaction.guild?.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (userSessions.length <= 0) {
      await interaction.reply({
        content: 'No sessions found',
        ephemeral: true,
      });
      return;
    }

    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'Guild not found',
        ephemeral: true,
      });
      return;
    }

    const leaderboard = R.pipe(
      userSessions,
      R.groupBy((x) => x.userId),
      R.mapValues((sessions) => {
        const durations = sessions.map((y) =>
          intervalToDuration({
            start: y.startedAt,
            end: y.endedAt ?? new Date(),
          })
        );
        return normalize(sum(...durations));
      })
    );

    let content = '';
    content += `**Leaderboard**\n`;
    Object.entries(leaderboard)
      .sort((a, b) => toMilliseconds(b[1]) - toMilliseconds(a[1]))
      .forEach(([userId, duration], index) => {
        const user = guild.members.cache.get(userId) ?? userId;
        const formattedDuration = formatDuration(duration);
        content += `${index + 1}. ${user} (${formattedDuration})\n`;
      });

    await interaction.reply({
      content,
      ephemeral: true,
    });
  }
}
