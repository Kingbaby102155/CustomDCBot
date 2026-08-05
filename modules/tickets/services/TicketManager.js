const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const config = require('../config.json');

class TicketManager {
    static async createTicket(interaction, dbModel) {
        const user = interaction.user;
        const guild = interaction.guild;

        const activeCount = await dbModel.count({ where: { userId: user.id, status: 'OPEN' } });
        if (activeCount >= config.max_open_tickets) {
            return interaction.reply({ content: `You can only open ${config.max_open_tickets} tickets at a time.`, ephemeral: true });
        }

        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: 0, 
            parent: config.ticket_category_id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: config.staff_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        await dbModel.create({ channelId: ticketChannel.id, userId: user.id, status: 'OPEN' });

        return ticketChannel;
    }

    static async closeTicket(channel, dbInstance, client) {
        const logChannel = await client.channels.fetch(config.log_channel_id);
        const transcript = await discordTranscripts.createTranscript(channel);

        const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Closed Archive')
            .addFields(
                { name: 'Ticket ID', value: channel.id, inline: true },
                { name: 'Channel Name', value: channel.name, inline: true }
            )
            .setColor('#ff0000')
            .setTimestamp();

        await logChannel.send({ embeds: [logEmbed], files: [transcript] });

        await dbInstance.update({ status: 'CLOSED' });

        return channel.delete();
    }
}

module.exports = TicketManager;
