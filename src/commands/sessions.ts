import { Command, RegisterBehavior } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { formatDistanceStrict, formatDistanceToNowStrict } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export class SessionsCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'sessions',
      description: 'view a users sessions',
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

    if (!user) {
      await interaction.reply({
        content: 'You must provide a user to view sessions',
        ephemeral: true,
      });
      return;
    }

    const { database } = this.container;

    const activeUserSession = await database.userSession.findFirst({
      where: {
        userId: user.id,
        endedAt: null,
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
      include: {
        VoiceSessionChannel: true,
      },
    });

    const userSessions = await database.userSession.findMany({
      where: {
        userId: user.id,
        endedAt: {
          not: null,
        },
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
      orderBy: {
        endedAt: 'desc',
      },
      take: 10,
      include: {
        VoiceSessionChannel: true,
      },
    });

    if (!activeUserSession && userSessions.length <= 0) {
      await interaction.reply(
        `No sessions found for ${user.username}#${user.discriminator}`
      );
      return;
    }

    let content = '';

    if (activeUserSession) {
      const distance = formatDistanceToNowStrict(activeUserSession.startedAt);
      const startTz = formatInTimeZone(
        activeUserSession.startedAt,
        'Europe/Oslo',
        'd. MMMM HH:mm:ss'
      );

      content += `**Active Session**\n`;
      content += `For ${distance} since ${startTz}\n`;
    }

    if (userSessions.length > 0) {
      content += `**Last 10 Sessions**\n`;
      userSessions.forEach((session) => {
        const duration = formatDistanceStrict(
          session.startedAt,
          session.endedAt!
        );
        const startedAtDateTz = formatInTimeZone(
          session.startedAt,
          'Europe/Oslo',
          'd. MMMM yyyy'
        );
        const startedAtTimeTz = formatInTimeZone(
          session.startedAt,
          'Europe/Oslo',
          'HH:mm:ss'
        );
        const endedAtTz = formatInTimeZone(
          session.endedAt!,
          'Europe/Oslo',
          'HH:mm:ss'
        );
        content += `${startedAtDateTz} **${startedAtTimeTz} - ${endedAtTz}** (${duration})\n`;
      });
    }

    const embed = new MessageEmbed().setDescription(content).setColor('BLUE');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
