// modules/tickets/commands/ticketadd.js
const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'ticketadd',
    description: 'Adds a specific user to the current ticket channel.',
    category: 'Tickets',
    async execute(message, args, client) {
        const TicketModel = client.models.Ticket;

        // 1. Check if the user executing the command is staff
        if (!message.member.roles.cache.has(config.staff_role_id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // 2. Verify the command is being used inside an active ticket channel
        const dbTicket = await TicketModel.findOne({ where: { channelId: message.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return message.reply('This command can only be used inside an active, open ticket channel.');
        }

        // 3. Find the target user mentioned in the message
        const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
        if (!targetUser) {
            return message.reply('Please mention a valid member or provide their user ID. Example: `!ticketadd @username`');
        }

        try {
            // 4. Update Discord channel permission overwrites dynamically
            await message.channel.permissionOverwrites.edit(targetUser.id, {
                [PermissionFlagsBits.ViewChannel]: true,
                [PermissionFlagsBits.SendMessages]: true,
                [PermissionFlagsBits.ReadMessageHistory]: true
            });

            // 5. Send confirmation message inside the ticket
            await message.reply(`Successfully added **${targetUser.username}** to this ticket channel.`);
        } catch (error) {
            console.error('Failed to add member to ticket channel permission nodes:', error);
            message.reply('An unexpected error occurred while trying to update permissions for this user.');
        }
    }
};
