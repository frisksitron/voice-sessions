import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { container } from '@sapphire/framework';

export class TestTask extends ScheduledTask {
  public constructor(
    context: ScheduledTask.Context,
    options: ScheduledTask.Options
  ) {
    super(context, {
      ...options,
      cron: '*/1 * * * *',
      // enabled: process.env.NODE_ENV === 'production',
    });
  }

  public async run() {
    const { client } = container;

    const test = client.guilds.cache.get('873202408484900957');
    const channel = test?.channels.cache.find((channel) => channel.isText());

    if (channel?.isText()) {
      // await channel.send('test');
    }
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    cron: never;
  }
}
