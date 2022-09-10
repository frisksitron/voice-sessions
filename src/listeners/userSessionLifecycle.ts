import { Events, Listener } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';

export class UserSessionLifecycle extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.VoiceStateUpdate,
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    const userId = oldState.member ? oldState.member.id : newState.member?.id;

    if (!userId) {
      return;
    }

    const { database } = this.container;

    if (oldState && oldState.channelId) {
      const userSession = await database.userSession.findFirst({
        where: {
          userId: userId,
          endedAt: null,
          voiceSessionChannelId: oldState.channelId,
        },
      });

      if (userSession) {
        await database.userSession.update({
          where: {
            id: userSession.id,
          },
          data: {
            endedAt: new Date(),
          },
        });
      }
    }

    if (newState && newState.channelId) {
      const voiceSession = await database.voiceSessionChannel.findUnique({
        where: {
          id: newState.channelId,
        },
      });

      if (voiceSession) {
        // End existing sessions
        const userSession = await database.userSession.findMany({
          where: {
            userId: userId,
            endedAt: null,
          },
        });
        if (userSession.length > 0) {
          await database.userSession.updateMany({
            where: {
              userId: userId,
              endedAt: null,
            },
            data: {
              endedAt: new Date(),
            },
          });
        }

        // Create new session
        await database.userSession.create({
          data: {
            userId: userId,
            voiceSessionChannelId: newState.channelId,
          },
        });
      }
    }
  }
}
