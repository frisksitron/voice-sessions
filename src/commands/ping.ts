import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ping',
      description: 'Ping pong',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const msg = await interaction.reply({
      content: 'Pinging...',
      ephemeral: true,
      fetchReply: true,
    });

    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);

      return interaction.editReply(
        `Pong! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`
      );
    }

    return interaction.editReply('Failed to get message instance');
  }
}
