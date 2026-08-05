const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'ticketsetup',
    description: 'Deploys the customized support panel configuration.',
    category: 'Tickets',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('Only administrators can deploy this panel.');
        }

        const setupEmbed = new EmbedBuilder()
            .setTitle(config.panel.title)
            .setDescription(config.panel.description)
            .setColor(config.panel.color || '#3498db')
            .setTimestamp();

        const componentRow = new ActionRowBuilder();

        if (config.mode === 'DROPDOWN') {
            // Build a dynamic select dropdown selection panel
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select_category')
                .setPlaceholder('Choose a support category...');

            config.categories.forEach(cat => {
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(cat.label)
                        .setDescription(cat.description)
                        .setValue(cat.id)
                        .setEmoji(cat.emoji)
                );
            });
            componentRow.addComponents(selectMenu);
        } else {
            // Build a row of separate visual buttons instead
            config.categories.forEach(cat => {
                componentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_btn_${cat.id}`)
                        .setLabel(cat.label)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji(cat.emoji)
                );
            });
        }

        try {
            await message.channel.send({ embeds: [setupEmbed], components: [componentRow] });
            await message.delete().catch(() => null);
        } catch (error) {
            console.error(error);
            message.reply('An error occurred deploying the dynamic panel configuration.');
        }
    }
};
