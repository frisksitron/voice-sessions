import { Command, RegisterBehavior } from '@sapphire/framework';

export class NewCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'new',
      description: 'add new creation channel',
      requiredUserPermissions: ['MANAGE_CHANNELS'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) =>
            option
              .setName('name')
              .setDescription('Name of the channel')
              .setRequired(false)
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.reply({
        content: 'Guild not found',
        ephemeral: true,
      });
      return;
    }

    const { database } = this.container;

    const guild = await database.guild.upsert({
      where: {
        id: guildId,
      },
      update: {},
      create: {
        id: guildId,
      },
    });

    const channelName =
      interaction.options.getString('name') || '➕ New Session';

    const channel = await interaction.guild.channels.create(channelName, {
      type: 'GUILD_VOICE',
      position: undefined,
      parent: undefined,
    });

    if (!channel) {
      await interaction.reply({
        content: 'Failed to create voice channel',
        ephemeral: true,
      });
      return;
    }

    await database.sessionCreationChannel.create({
      data: {
        id: channel.id,
        guildId: guild.id,
      },
    });

    await interaction.reply({
      content: `You can now start a session by joining ${channel}`,
      ephemeral: true,
    });
  }
}
