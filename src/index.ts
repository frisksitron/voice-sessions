process.env.NODE_ENV ??= 'development';

import 'reflect-metadata';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import * as colorette from 'colorette';
import { config } from 'dotenv-cra';
import { inspect } from 'util';
import { BotClient } from './bot-client';

// Load environment variables
config();

// Set default inspection depth
inspect.defaultOptions.depth = 1;

colorette.createColors({ useColor: true });

const client = new BotClient();

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
