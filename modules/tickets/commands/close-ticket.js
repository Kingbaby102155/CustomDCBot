// modules/tickets/commands/close-ticket.js
const TicketManager = require('../services/TicketManager');

module.exports = {
    name: 'close',
    description: 'Closes an active support ticket.',
    category: 'Tickets',
    async run(interaction) {
        const client = interaction.client;
        
        // 1. Safe optional chaining lookup for the mock testing environment
        const TicketModel = client.models?.Ticket;
        let dbTicket = null;

        // Only search the database if the model layer is fully loaded
        if (TicketModel) {
            dbTicket = await TicketModel.findOne({ where: { channelId: interaction.channel.id, status: 'OPEN' } });
            if (!dbTicket) {
                return interaction.reply({ content: 'This channel is not an active ticket or has already been archived.', ephemeral: true });
            }
        }

        try {
            await interaction.reply('Archiving logs and shutting down this ticket channel...');
            
            // 2. Pass execution off to the TicketManager service handler
            await TicketManager.closeTicket(interaction.channel, dbTicket, client);
        } catch (error) {
            console.error('Failed to properly shut down ticket channel:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An unexpected error occurred while trying to close this ticket.', ephemeral: true });
            }
        }
    }
};
