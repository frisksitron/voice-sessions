import { Command, RegisterBehavior } from '@sapphire/framework';
import prisma from '../database';

export class UserCommand extends Command {
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

    await prisma.guild.upsert({
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
