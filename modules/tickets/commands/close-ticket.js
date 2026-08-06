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

            // 1. Fetch the exact configuration block the test framework passes
            const moduleConfig = client.configurations?.tickets?.config?.[0] || require('../config.json');

            // 2. Invoke the functional signature expected by Jest tests
            // Arguments: client, interaction, database/channel context, configuration
            await closeTicket(client, interaction, dbTicket, moduleConfig);

        } catch (error) {
            console.error('Failed to properly shut down ticket channel:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An unexpected error occurred while trying to close this ticket.', ephemeral: true });
            }
        }
    }
};

// 3. Isolated function keeping backward-compatibility with the repository's unit tests
async function closeTicket(client, interaction, dbTicket, config) {
    return await TicketManager.closeTicket(interaction.channel, dbTicket, client);
}

// 4. Export the explicit sub-method so test suites can spy on or mock it directly
module.exports.closeTicket = closeTicket;
