process.env.NODE_ENV ??= 'development';

import 'reflect-metadata';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import { ScheduledTaskRedisStrategy } from '@sapphire/plugin-scheduled-tasks/register-redis';
import * as colorette from 'colorette';
import { config } from 'dotenv-cra';
import { inspect } from 'util';

// Load environment variables
config();

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
colorette.createColors({ useColor: true });

import { LogLevel, SapphireClient } from '@sapphire/framework';
const client = new SapphireClient({
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

const main = async () => {
  try {
    client.logger.info('Logging in');
    await client.login();
    client.logger.info('logged in');
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
  }
};

main();
