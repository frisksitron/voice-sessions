import { AllFlowsPrecondition } from '@sapphire/framework';
import type {
  CommandInteraction,
  ContextMenuInteraction,
  Message,
  GuildMember,
} from 'discord.js';
import { envParseArray } from '../env-parser';

const OWNERS = envParseArray('OWNERS');

export class StenbergOnlyPrecondition extends AllFlowsPrecondition {
  public override async messageRun(message: Message) {
    return this.checkMod(message.member!);
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    return this.checkMod(interaction.member! as GuildMember);
  }

  public override async contextMenuRun(interaction: ContextMenuInteraction) {
    return this.checkMod(interaction.member! as GuildMember);
  }

  private async checkMod(user: GuildMember) {
    return user.id === '152782597083103232' || OWNERS.includes(user.id)
      ? this.ok()
      : this.error({ message: 'Wait... Who are you?!' });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    StenbergOnly: never;
  }
}
