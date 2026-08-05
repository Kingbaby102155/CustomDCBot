// modules/tickets/commands/claim.js
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'claim',
    description: 'Claims responsibility for handling the current ticket.',
    category: 'Tickets',
    async execute(message, args, client) {
        const TicketModel = client.models.Ticket;

        // 1. Staff validation check
        if (!message.member.roles.cache.has(config.staff_role_id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You do not have permission to claim tickets.');
        }

        // 2. Locate active ticket record
        const dbTicket = await TicketModel.findOne({ where: { channelId: message.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return message.reply('This command can only be used inside an active, open ticket channel.');
        }

        try {
            // 3. Revoke view access from the general staff role, assign it exclusively to the user
            await message.channel.permissionOverwrites.set([
                { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: dbTicket.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                // Administrators retain structural bypass permission flags natively
            ]);

            // 4. Visual announcement inside the support workspace
            const claimEmbed = new EmbedBuilder()
                .setTitle('Ticket Claimed')
                .setDescription(`This support thread is now being handled exclusively by **${message.author.username}**.`)
                .setColor('#00ff00')
                .setTimestamp();

            await message.reply({ embeds: [claimEmbed] });
        } catch (error) {
            console.error('Failed to isolate channel permissions during claim execution:', error);
            message.reply('An error occurred while locking down this channel to your account.');
        }
    }
};
