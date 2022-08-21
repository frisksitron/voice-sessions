import type {
  UserError,
  ChatInputCommandDeniedPayload,
} from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

export class CommandDeniedListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: false,
      event: 'chatInputCommandDenied',
    });
  }

  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    return interaction.reply(error.message);
  }
}
