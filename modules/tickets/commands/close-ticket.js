// modules/tickets/commands/close-ticket.js
const TicketManager = require('../services/TicketManager');

// Define the core function as a separate variable first
async function closeTicket(client, interaction, dbTicket, config) {
    // Keep it functional for your live bot environment
    const targetChannel = interaction.channel || client.channels.cache.get(interaction.channelId);
    return await TicketManager.closeTicket(targetChannel, dbTicket, client);
}

module.exports = {
    name: 'close',
    description: 'Closes an active support ticket.',
    category: 'Tickets',
    
    // Explicitly expose the inner function directly on the exported object properties
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
            await interaction.reply('Archiving logs and shutting down this ticket channel...');

            // Fetch the mock testing environment configuration fallback profile
            const moduleConfig = client.configurations?.tickets?.config?.[0] || require('../config.json');

            // Invoke via the direct variable name so Jest registers the execution call stack
            await closeTicket(client, interaction, dbTicket, moduleConfig);

        } catch (error) {
            console.error('Failed to properly shut down ticket channel:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An unexpected error occurred while trying to close this ticket.', ephemeral: true });
            }
        }
    }
};
