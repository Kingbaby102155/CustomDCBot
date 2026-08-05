// modules/tickets/services/InactivityChecker.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const TicketManager = require('./TicketManager');

class InactivityChecker {
    static start(client) {
        const configPath = path.join(__dirname, '../config.json');
        
        // Convert configurations to milliseconds safely
        setInterval(async () => {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (!config.inactivity_system || !config.inactivity_system.enabled) return;

            const TicketModel = client.models.Ticket;
            const openTickets = await TicketModel.findAll({ where: { status: 'OPEN' } });

            const now = Date.now();
            const warnMs = config.inactivity_system.warn_after_minutes * 60 * 1000;
            const closeMs = config.inactivity_system.close_after_minutes * 60 * 1000;

            for (const ticket of openTickets) {
                try {
                    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
                    if (!channel) {
                        // Clean up database if a staff member deleted a channel manually
                        await ticket.update({ status: 'CLOSED' });
                        continue;
                    }

                    const messages = await channel.messages.fetch({ limit: 1 });
                    const lastMessage = messages.first();
                    if (!lastMessage) continue; // Skip if channel generation message isn't indexed yet

                    const timeIdle = now - lastMessage.createdTimestamp;

                    // --- SCENARIO 1: TRIGGER THE FINAL CLOSE DOWN ---
                    if (timeIdle >= closeMs) {
                        await channel.send({ content: config.inactivity_system.close_message });
                        
                        // Hand off execution straight to your robust central TicketManager code
                        await TicketManager.closeTicket(channel, ticket, client);
                        continue;
                    }

                    // --- SCENARIO 2: TRIGGER THE WARNING COUNTDOWN NOTICE ---
                    if (timeIdle >= warnMs) {
                        // Guardrail check: Prevent the bot from spamming the warning repeatedly
                        if (lastMessage.author.id === client.user.id && lastMessage.content.includes('⚠️')) continue;

                        const userTag = `<@${ticket.userId}>`;
                        const dynamicTimeRemaining = config.inactivity_system.close_after_minutes - config.inactivity_system.warn_after_minutes;
                        
                        let parsedWarn = config.inactivity_system.warn_message
                            .replace(/{user}/g, userTag)
                            .replace(/{time}/g, dynamicTimeRemaining.toString());

                        await channel.send({ content: parsedWarn });
                    }

                } catch (error) {
                    console.error(`Error sweeping inactivity for channel ${ticket.channelId}:`, error);
                }
            }
        }, 5 * 60 * 1000); // Loops securely every 5 minutes
    }
}

module.exports = InactivityChecker;
