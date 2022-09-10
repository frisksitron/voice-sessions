import { Events, Listener } from '@sapphire/framework';
import type { Activity, Presence } from 'discord.js';

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

export class UserPresenceListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.PresenceUpdate,
    });
  }

  public async run(oldPresence: Presence, newPresence: Presence) {
    for (const presence of [oldPresence, newPresence]) {
      if (!presence) {
        continue;
      }

      if (!presence.member?.voice.channel) {
        continue;
      }

      const { database } = this.container;

      const voiceSession = await database.voiceSessionChannel.findUnique({
        where: {
          id: presence.member.voice.channel.id,
        },
        include: {
          SessionCreationChannel: true,
        },
      });

      if (!voiceSession) {
        continue;
      }

      const channel = presence.member.voice.channel;

      const template =
        voiceSession.SessionCreationChannel?.template || '%emoji% %name%';

      let newChannelName: string;

      if (voiceSession.SessionCreationChannel?.usePresence) {
        const activities = channel.members
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

      if (newChannelName !== channel.name) {
        await channel.setName(newChannelName);
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
