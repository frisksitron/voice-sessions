import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../database';

@ApplyOptions<CommandOptions>({
	description: 'register guild',
	requiredUserPermissions: ['MANAGE_CHANNELS']
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		await send(message, 'Registering guild...');

		if (!message.guild) {
			return send(message, `Failed to register guild. Please try again later.`);
		}

		await prisma.guild.create({
			data: {
				id: message.guild?.id
			}
		});

		return send(message, `Registered ${message.guild.name} successfully!`);
	}
}
