// modules/tickets/commands/unclaim.js
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'unclaim',
    description: 'Releases a claimed ticket back to the general support pool.',
    category: 'Tickets',
    async run(interaction, args, client) {
        const TicketModel = client.models.Ticket;

        // 1. Staff validation check
        if (!interaction.member.roles.cache.has(config.staff_role_id) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        // 2. Locate active ticket record
        const dbTicket = await TicketModel.findOne({ where: { channelId: interaction.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return interaction.reply('This command can only be used inside an active, open ticket channel.');
        }

        try {
            // 3. Restore view permissions back to the generic staff role
            await interaction.channel.permissionOverwrites.set([
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: dbTicket.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: config.staff_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
            ]);

            // 4. Send visual confirmation embed
            const unclaimEmbed = new EmbedBuilder()
                .setTitle('Ticket Unclaimed')
                .setDescription('This ticket has been returned to the support pool. Any available staff member can now assist.')
                .setColor('#e67e22')
                .setTimestamp();

            await interaction.reply({ embeds: [unclaimEmbed] });
        } catch (error) {
            console.error('Failed to restore permissions during unclaim:', error);
            await interaction.reply('An error occurred while opening this channel back up to the staff role.');
        }
    }
};
