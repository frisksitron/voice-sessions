import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import prisma from '../database';

@ApplyOptions<CommandOptions>({
	description: 'add new creation channel',
	requiredUserPermissions: ['MANAGE_CHANNELS']
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		await send(message, 'Adding creation channel...');

		if (!message.guild) {
			return send(message, `Failed to add creation channel. Please try again later.`);
		}

		const guild = await prisma.guild.upsert({
			where: {
				id: message.guild.id
			},
			update: {},
			create: {
				id: message.guild.id
			}
		});

		const channel = await message.guild?.channels.create('➕ New Session', {
			type: 'GUILD_VOICE'
		});

		if (!channel) {
			return send(message, `Failed to add creation channel. Please try again later.`);
		}

		await prisma.sessionCreationChannel.create({
			data: {
				id: channel.id,
				guildId: guild.id
			}
		});

		return send(message, `Added new creation channel: ${channel?.name}`);
	}
}
