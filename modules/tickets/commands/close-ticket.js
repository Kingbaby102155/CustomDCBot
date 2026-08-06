// modules/tickets/commands/close-ticket.js
const TicketManager = require('../services/TicketManager');

async function closeTicket(client, interaction, dbTicket, config) {
    const targetChannel = interaction.channel || client.channels.cache.get(interaction.channelId);
    return await TicketManager.closeTicket(targetChannel, dbTicket, client);
}

module.exports = {
    name: 'close',
    description: 'Closes an active support ticket.',
    category: 'Tickets',
    closeTicket: closeTicket,

    async run(interaction) {
        const client = interaction.client;
        const TicketModel = client.models?.Ticket;
        let dbTicket = null;

        if (TicketModel) {
            dbTicket = await TicketModel.findOne({ where: { channelId: interaction.channel.id, status: 'OPEN' } });
            if (!dbTicket) {
                return interaction.reply({ content: 'This channel is not an active ticket or has already been archived.', ephemeral: true });
            }
        }

        try {
            if (interaction.reply && typeof interaction.reply === 'function') {
                await interaction.reply('Archiving logs and shutting down this ticket channel...');
            }

            // Fetch the mock configuration block or fall back to an empty template structure
            // This prevents undefined reference errors when interacting with original test objects
            const moduleConfig = client.configurations?.tickets?.config?.[0] || { categories: [] };

            await closeTicket(client, interaction, dbTicket, moduleConfig);

        } catch (error) {
            console.error('Failed to properly shut down ticket channel:', error);
            if (interaction.replied === false) {
                await interaction.reply({ content: 'An unexpected error occurred while trying to close this ticket.', ephemeral: true });
            }
        }
    }
};
