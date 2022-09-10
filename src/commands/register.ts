import { Command, RegisterBehavior } from '@sapphire/framework';

export class RegisterCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'register',
      description: 'register guild',
      requiredUserPermissions: ['MANAGE_CHANNELS'],
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
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Guild not found',
        ephemeral: true,
      });
      return;
    }

    const { database } = this.container;

    await database.guild.upsert({
      where: {
        id: interaction.guild.id,
      },
      update: {},
      create: {
        id: interaction.guild.id,
      },
    });

    await interaction.reply({
      content: `Registered ${interaction.guild.name} successfully!`,
      ephemeral: true,
    });
  }
}
