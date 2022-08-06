import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../lib/database';

@ApplyOptions<CommandOptions>({
	description: 'add new creation channel',
	requiredUserPermissions: ['MANAGE_CHANNELS']
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		await send(message, 'Adding creation channel...');

		const channel = await message.guild?.channels.create('➕ New Session', {
			type: 'GUILD_VOICE'
		});

		if (!channel) {
			return;
		}

		await prisma.sessionCreationChannel.create({
			data: {
				id: channel.id
			}
		});

		return send(message, `Added new creation channel: ${channel?.name}`);
	}
}
