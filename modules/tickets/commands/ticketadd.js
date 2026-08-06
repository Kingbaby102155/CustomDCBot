// modules/tickets/commands/ticketadd.js
const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'ticketadd',
    description: 'Adds a specific user to the current ticket channel.',
    category: 'Tickets',
    async run(interaction) {
        const client = interaction.client;
        const TicketModel = client.models.Ticket;

        if (!interaction.member.roles.cache.has(config.staff_role_id) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const dbTicket = await TicketModel.findOne({ where: { channelId: interaction.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return interaction.reply({ content: 'This command can only be used inside an active, open ticket channel.', ephemeral: true });
        }

        // Pull target from command options inside a slash interaction environment
        const targetUser = interaction.options?.getUser('user');
        if (!targetUser) {
            return interaction.reply({ content: 'Please provide a valid member.', ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(targetUser.id, {
                [PermissionFlagsBits.ViewChannel]: true,
                [PermissionFlagsBits.SendMessages]: true,
                [PermissionFlagsBits.ReadMessageHistory]: true
            });

            await interaction.reply(`Successfully added **${targetUser.username}** to this ticket channel.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An unexpected error occurred.', ephemeral: true });
        }
    }
};
