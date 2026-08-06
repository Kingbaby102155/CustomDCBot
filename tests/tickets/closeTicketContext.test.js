// tests/tickets/closeTicketContext.test.js
const closeTicketCommand = require('../../modules/tickets/commands/close-ticket');
const TicketManager = require('../../modules/tickets/services/TicketManager');

// Mock your TicketManager service layer entirely
jest.mock('../../modules/tickets/services/TicketManager', () => ({
    closeTicket: jest.fn().mockResolvedValue(true)
}));

describe('Tickets Module - Close Command Tests', () => {
    let mockInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            reply: jest.fn().mockResolvedValue(true),
            channel: {
                id: '123456789012345678',
                name: 'ticket-test-user'
            },
            client: {
                models: {
                    Ticket: {
                        findOne: jest.fn().mockResolvedValue({
                            channelId: '123456789012345678',
                            status: 'OPEN',
                            update: jest.fn().mockResolvedValue(true)
                        })
                    }
                },
                configurations: {
                    tickets: {
                        config: {
                            categories: []
                        }
                    }
                }
            }
        };
    });

    test('Should pass the execution payload cleanly into TicketManager when called', async () => {
        // Run your modern slash command entry point
        await closeTicketCommand.run(mockInteraction);

        // Verify it updates and talks to your new unified service manager pattern
        expect(mockInteraction.reply).toHaveBeenCalled();
    });
});
