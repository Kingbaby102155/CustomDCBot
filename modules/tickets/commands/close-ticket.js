// modules/tickets/commands/close-ticket.js
const TicketManager = require('../services/TicketManager');

module.exports = {
    name: 'close',
    description: 'Closes an active support ticket.',
    category: 'Tickets',
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

            // Retrieve the active mock testing configuration profile safely
            const moduleConfig = client.configurations?.tickets?.config?.[0] || require('../config.json');

            // CRITICAL JEST FIX: Route the function call through module.exports 
            // This allows Jest's spy wrapper to intercept and log the execution call
            await module.exports.closeTicket(client, interaction, dbTicket, moduleConfig);

        } catch (error) {
            console.error('Failed to properly shut down ticket channel:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An unexpected error occurred while trying to close this ticket.', ephemeral: true });
            }
        }
    },

    // The precise function signature and placement expected by the unit test suite
    async closeTicket(client, interaction, dbTicket, config) {
        return await TicketManager.closeTicket(interaction.channel, dbTicket, client);
    }
};
