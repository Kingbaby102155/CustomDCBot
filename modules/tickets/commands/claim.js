// modules/tickets/commands/claim.js
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'claim',
    description: 'Claims responsibility for handling the current ticket.',
    category: 'Tickets',
    async run(interaction) {
        const client = interaction.client;
        const TicketModel = client.models.Ticket;

        if (!interaction.member.roles.cache.has(config.staff_role_id) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to claim tickets.', ephemeral: true });
        }

        const dbTicket = await TicketModel.findOne({ where: { channelId: interaction.channel.id, status: 'OPEN' } });
        if (!dbTicket) {
            return interaction.reply({ content: 'This command can only be used inside an active, open ticket channel.', ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.set([
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: dbTicket.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
            ]);

            const claimEmbed = new EmbedBuilder()
                .setTitle('Ticket Claimed')
                .setDescription(`This support thread is now being handled exclusively by **${interaction.user.username}**.`)
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.reply({ embeds: [claimEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred locking down this channel.', ephemeral: true });
        }
    }
};
