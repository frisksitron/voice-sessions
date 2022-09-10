import { Events, Listener } from '@sapphire/framework';
import type { Activity, VoiceState } from 'discord.js';

const emojiDictionary = new Map([
  ['lounge', '🍹'],
  ['viewing party', '📺'],
  ["vibin'", '🎧'],
  ['rocket league', '🚀'],
  ['7 days to die', '🧟'],
  ['poker', '🃏'],
  ['escape from tarkov', '🔫'],
  ['pummel party', '🎉'],
  ['f1 2021', '🏎'],
  ['f1 2022', '🏎'],
  ['f1 22', '🏎'],
  ['factorio', '⚙️'],
  ['league of legends', '️⚔️'],
  ["tiny tina's wonderlands", '🌈'],
  ['heartstone', '🃏'],
  ['for the king', '👑'],
]);

export class VoiceSessionLifecycle extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.VoiceStateUpdate,
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    const { database } = this.container;

    // Remove empty voice channel
    if (oldState.channel && oldState.channel.members.size <= 0) {
      const oldChannelId = oldState.channel.id;

      const session = await database.voiceSessionChannel.findUnique({
        where: {
          id: oldChannelId,
        },
      });

      if (session) {
        await oldState.channel.delete();

        await database.voiceSessionChannel.update({
          where: {
            id: oldChannelId,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      }
    }

    // Create new voice channel
    if (newState.channel) {
      const sessionCreationChannel =
        await database.sessionCreationChannel.findFirst({
          where: {
            id: newState.channel.id,
          },
        });

      if (sessionCreationChannel) {
        const channel = await newState.guild.channels.fetch(
          sessionCreationChannel.id
        );

        // Create new channel
        const newChannel = await newState.guild.channels.create(
          '⌛ Initializing...',
          {
            type: 'GUILD_VOICE',
            bitrate: newState.guild.maximumBitrate,
            parent: channel?.parent ?? undefined,
            position: channel?.rawPosition,
          }
        );

        // Update position of the next channels to accomodate the new channel
        const channels = channel?.parent?.children
          .filter((x) => x.type === 'GUILD_VOICE')
          .sort(
            (a, b) => a.rawPosition - b.rawPosition || a.id.localeCompare(b.id)
          );

        const channelArray = Array.from(channels?.values() || []);

        console.log(
          'channelArray',
          channelArray.map((x) => `${x.rawPosition} ${x.position} ${x.name}`)
        );

        const channelIndex = channelArray.findIndex(
          (x) => x.id === sessionCreationChannel.id
        );
        const restOfChannels = channelArray.slice(channelIndex + 1);
        const nextChannels = restOfChannels.filter(
          (x) => x.rawPosition === channel?.rawPosition
        );
        if (nextChannels.length > 0) {
          console.log('Updating position of channels');
          console.log('Next channels', nextChannels);

          for (const rest of restOfChannels) {
            console.log("Updating channel's position", rest.name);
            console.log('Old position', rest.rawPosition);
            console.log('New position', rest.rawPosition + 1);

            await rest.edit({
              position: rest.position + 1,
            });
          }
        }

        // Update database with new channel
        await database.voiceSessionChannel.create({
          data: {
            id: newChannel.id,
            sessionCreationChannelId: sessionCreationChannel.id,
          },
        });

        // Move member to new voice channel
        await newState.member?.voice.setChannel(newChannel.id);
      }
    }

    // Rename channel
    const voiceSessions = await database.voiceSessionChannel.findMany({
      where: {
        deletedAt: {
          equals: null,
        },
      },
      include: {
        SessionCreationChannel: true,
      },
    });

    for (const state of [oldState, newState]) {
      if (!state) {
        continue;
      }

      const voiceSession = voiceSessions.find(
        (session) => session.id === state.channelId
      );

      if (!voiceSession || !state.channel) {
        continue;
      }

      const template =
        voiceSession.SessionCreationChannel?.template || '%emoji% %name%';

      let newChannelName: string;

      if (voiceSession.SessionCreationChannel?.usePresence) {
        const activities = state.channel.members
          .map((x) => x.presence?.activities)
          .flat()
          .filter((x): x is Activity => !!x);

        const activityName = generateNameFromActivities(
          activities,
          voiceSession.SessionCreationChannel?.fallbackName
        );
        newChannelName = applyTemplate(template, activityName);
      } else {
        newChannelName = applyTemplate(
          template,
          voiceSession.SessionCreationChannel?.fallbackName ?? 'Lounge'
        );
      }

      if (newChannelName !== state.channel.name) {
        await state.channel.setName(newChannelName);
      }
    }
  }
}

const applyTemplate = (template: string, name: string) => {
  return template
    .replaceAll('%emoji%', emojiDictionary.get(name.toLowerCase()) || '🎮')
    .replaceAll('%name%', name);
};

const generateNameFromActivities = (
  activities: Activity[],
  fallback: string | undefined
): string => {
  const games = activities
    .filter((x) => x?.type === 'PLAYING')
    .map((x) => x?.name)
    .filter((x) => x !== undefined);

  const uniqueGames = [...new Set(games)];

  if (uniqueGames.length > 0) {
    return uniqueGames.join(', ');
  }

  const isStreaming = activities.some((x) => x?.type === 'STREAMING');

  if (isStreaming) {
    return 'Viewing Party';
  }

  const isListening = activities.some((x) => x?.type === 'LISTENING');

  if (isListening) {
    return "Vibin'";
  }

  return fallback ?? 'Lounge';
};
