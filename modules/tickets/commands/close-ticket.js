const TicketManager = require('../services/TicketManager');

module.exports = {
    name: 'close',
    description: 'Closes an active support ticket.',
    category: 'Tickets',
    async execute(message, args, client) {
        const TicketModel = client.models.Ticket;

        const dbTicket = await TicketModel.findOne({ where: { channelId: message.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return message.reply('This channel is not an active ticket or has already been archived.');
        }

        try {
            await message.reply('Archiving logs and shutting down this ticket channel...');
            await TicketManager.closeTicket(message.channel, dbTicket, client);
        } catch (error) {
            console.error('Failed to properly shut down ticket channel:', error);
            message.reply('An unexpected error occurred while trying to close this ticket.');
        }
    }
};
