// modules/tickets/events/interactionCreate.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const configPath = path.join(__dirname, '../config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const TicketModel = client.models.Ticket;

        let selectedCategoryId = null;

        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_category') {
            selectedCategoryId = interaction.values[0];
        } else if (interaction.isButton() && interaction.customId.startsWith('ticket_btn_')) {
            selectedCategoryId = interaction.customId.replace('ticket_btn_', '');
        }

        if (selectedCategoryId) {
            const categoryData = config.categories.find(c => c.id === selectedCategoryId);
            if (!categoryData) return interaction.reply({ content: 'Category config not found.', ephemeral: true });

            const activeCount = await TicketModel.count({ where: { userId: interaction.user.id, status: 'OPEN' } });
            if (activeCount >= config.max_open_tickets) {
                return interaction.reply({ content: `You can only open ${config.max_open_tickets} tickets at a time.`, ephemeral: true });
            }

            const activeStaffRole = categoryData.custom_staff_role || config.staff_role_id;

            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${categoryData.id}`)
                .setTitle(`${categoryData.label} Details`);

            if (categoryData.questions.length === 0) {
                return await openTicketChannel(interaction, categoryData, activeStaffRole, TicketModel, config, [], client);
            }

            categoryData.questions.slice(0, 5).forEach(q => {
                const textInput = new TextInputBuilder()
                    .setCustomId(q.id)
                    .setLabel(q.label)
                    .setStyle(q.style === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                    .setRequired(q.required !== undefined ? q.required : true);
                
                if (q.placeholder) textInput.setPlaceholder(q.placeholder);
                if (q.min_length) textInput.setMinLength(q.min_length);
                if (q.max_length) textInput.setMaxLength(q.max_length);
                
                modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            });

            return await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            const catId = interaction.customId.replace('ticket_modal_', '');
            const categoryData = config.categories.find(c => c.id === catId);
            const activeStaffRole = categoryData.custom_staff_role || config.staff_role_id;

            const answers = categoryData.questions.map(q => ({
                label: q.label,
                value: interaction.fields.getTextInputValue(q.id)
            }));

            return await openTicketChannel(interaction, categoryData, activeStaffRole, TicketModel, config, answers, client);
        }
    }
};

// Formatting utility helper function to parse string variable blocks dynamically
function parseTemplate(templateString, user, category, channel) {
    if (!templateString) return '';
    return templateString
        .replace(/{user}/g, `${user}`)
        .replace(/{category}/g, `${category}`)
        .replace(/{channel}/g, `${channel}`);
}

async function openTicketChannel(interaction, categoryData, staffRole, TicketModel, config, answers, client) {
    const user = interaction.user;
    const guild = interaction.guild;

    const ticketChannel = await guild.channels.create({
        name: `${categoryData.id}-${user.username}`,
        type: 0,
        parent: categoryData.category_id,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: staffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
    });

    await TicketModel.create({ channelId: ticketChannel.id, userId: user.id, status: 'OPEN' });

    // --- 1. COMPILE CUSTOMIZABLE TICKET WELCOME PANEL MESSAGE ---
    const parsedTitle = parseTemplate(config.welcome_message.title, user, categoryData.label, ticketChannel);
    const parsedDesc = parseTemplate(config.welcome_message.description, user, categoryData.label, ticketChannel);

    const welcomeEmbed = new EmbedBuilder()
        .setTitle(parsedTitle)
        .setDescription(parsedDesc)
        .setColor(config.panel.color || '#3498db')
        .setTimestamp();

    answers.forEach(ans => {
        welcomeEmbed.addFields({ name: ans.label, value: ans.value || '*None*' });
    });

    // Send the custom welcome embedded response right into the freshly opened text space
    await ticketChannel.send({ content: `${user} | <@&${staffRole}>`, embeds: [welcomeEmbed] });

    // --- 2. COMPILE CUSTOMIZABLE EXTERNAL STAFF MANAGER ALERT ---
    if (config.staff_alert && config.staff_alert.enabled) {
        try {
            const alertChannel = await client.channels.fetch(config.staff_alert.channel_id);
            if (alertChannel) {
                const parsedAlertTitle = parseTemplate(config.staff_alert.title, user, categoryData.label, ticketChannel);
                const parsedAlertDesc = parseTemplate(config.staff_alert.description, user, categoryData.label, ticketChannel);

                const alertEmbed = new EmbedBuilder()
                    .setTitle(parsedAlertTitle)
                    .setDescription(parsedAlertDesc)
                    .setColor('#e74c3c')
                    .setTimestamp();

                await alertChannel.send({ embeds: [alertEmbed] });
            }
        } catch (err) {
            console.error('Could not fire staff logs notification event:', err);
        }
    }

    if (interaction.replied || interaction.deferred) {
        return await interaction.editReply({ content: `Ticket space deployment complete: ${ticketChannel}` });
    } else {
        return await interaction.reply({ content: `Ticket space deployment complete: ${ticketChannel}`, ephemeral: true });
    }
}
