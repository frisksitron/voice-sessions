import { PrismaClient } from '@prisma/client';
import { container, SapphireClient, LogLevel } from '@sapphire/framework';
import { ScheduledTaskRedisStrategy } from '@sapphire/plugin-scheduled-tasks/register-redis';

export class BotClient extends SapphireClient {
  public constructor() {
    super({
      shards: 'auto',
      intents: [
        'GUILDS',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGES',
        'GUILD_PRESENCES',
      ],
      presence: {
        activities: [
          {
            name: 'slash commands',
            type: 'LISTENING',
          },
        ],
      },
      logger: {
        level: LogLevel.Debug,
      },
      tasks: {
        strategy: new ScheduledTaskRedisStrategy({
          bull: {
            connection: {
              host: process.env.REDIS_HOST,
              port: Number(process.env.REDIS_PORT),
              password: process.env.REDIS_PASSWORD,
            },
          },
        }),
      },
    });
  }
  public override async login(token?: string) {
    container.database = new PrismaClient();
    return super.login(token);
  }
  public override async destroy() {
    await container.database.$disconnect();
    return super.destroy();
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    database: PrismaClient;
  }
}
