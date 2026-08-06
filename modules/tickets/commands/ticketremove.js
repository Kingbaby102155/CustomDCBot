// modules/tickets/commands/ticketremove.js
const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'ticketremove',
    description: 'Removes a specific user from the current ticket channel.',
    category: 'Tickets',
    async run(interaction, args, client) {
        const TicketModel = client.models.Ticket;

        // 1. Staff validation check
        if (!interaction.member.roles.cache.has(config.staff_role_id) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        // 2. Active ticket verification
        const dbTicket = await TicketModel.findOne({ where: { channelId: interaction.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return interaction.reply('This command can only be used inside an active, open ticket channel.');
        }

        // 3. Extract the target user
        const targetUser = interaction.mentions.users.first() || (args && args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
        if (!targetUser) {
            return interaction.reply('Please mention a valid member or provide their user ID. Example: `!ticketremove @username`');
        }

        // Guardrail: Prevent staff from accidentally locking out the ticket creator
        if (targetUser.id === dbTicket.userId) {
            return interaction.reply('You cannot remove the original creator of this ticket.');
        }

        try {
            // 4. Delete the target user's custom channel permission node completely
            await interaction.channel.permissionOverwrites.delete(targetUser.id);
            await interaction.reply(`Successfully removed **${targetUser.username}** from this ticket channel.`);
        } catch (error) {
            console.error('Failed to remove member from ticket channel:', error);
            await interaction.reply('An unexpected error occurred while updating channel permissions.');
        }
    }
};
