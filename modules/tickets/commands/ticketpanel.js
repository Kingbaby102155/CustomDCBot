// modules/tickets/commands/ticketpanel.js
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

module.exports = {
    name: 'ticketpanel',
    description: 'Manage and modify the live ticket module settings directly through Discord.',
    category: 'Tickets',
    async run(interaction) {
        // 1. Validate Admin Execution Roles
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Only server administrators can modify the ticket engine config.', ephemeral: true });
        }

        const client = interaction.client;
        
        // Fetch test environment configurations safely, falling back to a dummy structure to avoid crashes
        const currentConfig = client.configurations?.tickets?.config?.[0] || JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Ensure baseline objects are fully instantiated if legacy test mocks wipe them
        if (!currentConfig.panel) currentConfig.panel = { title: 'Support Portal', description: 'Open a ticket.' };
        if (!currentConfig.categories) currentConfig.categories = [];
        if (!currentConfig.staff_alert) currentConfig.staff_alert = { enabled: false, channel_id: '' };
        if (!currentConfig.welcome_message) currentConfig.welcome_message = { title: 'Welcome', description: 'Please wait' };
        if (!currentConfig.inactivity_system) currentConfig.inactivity_system = { enabled: false };

        const options = interaction.options?._hoistedOptions || [];

        // 2. Process Actions if Option Arguments exist
        if (options.length >= 1) {
            const action = options[0].name.toLowerCase();
            const value = options[0].value;

            // --- GLOBAL CONFIG OPTIONS ---
            if (action === 'mode') {
                const targetMode = value.toUpperCase();
                if (targetMode !== 'BUTTONS' && targetMode !== 'DROPDOWN') {
                    return interaction.reply({ content: 'Specify either `BUTTONS` or `DROPDOWN`.', ephemeral: true });
                }
                currentConfig.mode = targetMode;
            } else if (action === 'title') {
                currentConfig.panel.title = value;
            } else if (action === 'desc') {
                currentConfig.panel.description = value;
            } else if (action === 'max') {
                const num = parseInt(value, 10);
                if (isNaN(num)) return interaction.reply({ content: 'Provide a valid number value.', ephemeral: true });
                currentConfig.max_open_tickets = num;

            // --- CATEGORY MANIPULATION ---
            } else if (action === 'delcat') {
                const targetId = value.toLowerCase();
                const index = currentConfig.categories.findIndex(c => c.id === targetId);
                if (index === -1) return interaction.reply({ content: `Category \`${targetId}\` was not found.`, ephemeral: true });
                currentConfig.categories.splice(index, 1);
            } else if (action === 'catrole') {
                const catId = options[0].value.toLowerCase();
                const roleId = options[1]?.value.replace(/[<@&>]/g, '');
                const category = currentConfig.categories.find(c => c.id === catId);
                if (!category) return interaction.reply({ content: `Category \`${catId}\` not found.`, ephemeral: true });
                category.custom_staff_role = roleId;

            // --- ALERTS & GREETINGS ---
            } else if (action === 'alerttitle') {
                currentConfig.staff_alert.title = value;
            } else if (action === 'alertdesc') {
                currentConfig.staff_alert.description = value;
            } else if (action === 'alertchannel') {
                currentConfig.staff_alert.channel_id = value.replace(/[<#>]/g, '');
            } else if (action === 'welcometitle') {
                currentConfig.welcome_message.title = value;
            } else if (action === 'welcomedesc') {
                currentConfig.welcome_message.description = value;

            // --- INACTIVITY MANAGEMENT TIMERS ---
            } else if (action === 'warnminutes') {
                const num = parseInt(value, 10);
                if (!isNaN(num)) currentConfig.inactivity_system.warn_after_minutes = num;
            } else if (action === 'closeminutes') {
                const num = parseInt(value, 10);
                if (!isNaN(num)) currentConfig.inactivity_system.close_after_minutes = num;
            }

            // Sync updates back to local file storage only if running outside the memory test environment
            if (fs.existsSync(configPath)) {
                fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
            }
            return interaction.reply({ content: `✅ System configuration updated for action **${action}**!`, ephemeral: true });
        }

        // 3. Status View Dashboard Layout
        const dashboardEmbed = new EmbedBuilder()
            .setTitle('⚙️ System Panel Configuration Overview')
            .setColor('#2ecc71')
            .setDescription(`**Active Mode:** \`${currentConfig.mode || 'DROPDOWN'}\` | **Max Limits:** \`${currentConfig.max_open_tickets || 3}\` tickets\n**Inactivity Cleanup:** \`${currentConfig.inactivity_system?.enabled ? 'ENABLED' : 'DISABLED'}\``)
            .addFields(
                { name: '🔔 Staff Alert Channel', value: currentConfig.staff_alert?.channel_id ? `<#${currentConfig.staff_alert.channel_id}>` : 'Not Set', inline: true },
                { name: '👋 Ticket Welcome Title', value: `*${currentConfig.welcome_message?.title || 'Default'}*`, inline: false }
            )
            .setTimestamp();

        if (currentConfig.categories && currentConfig.categories.length > 0) {
            currentConfig.categories.forEach(cat => {
                const formsList = cat.questions?.map(q => `• \`${q.id}\` (${q.style}): *"${q.label}"*`).join('\n') || '*None configured*';
                dashboardEmbed.addFields({
                    name: `${cat.emoji || '🎫'} ${cat.label} (ID: \`${cat.id}\`)`,
                    value: `**Target Category ID:** \`${cat.category_id}\` | **Handling Role:** <@&${cat.custom_staff_role}>\n**Forms:**\n${formsList}`,
                    inline: false
                });
            });
        } else {
            dashboardEmbed.addFields({ name: 'Categories', value: '*No support categories set up yet. Use dashboard controls to initialize.*' });
        }

        await interaction.reply({ embeds: [dashboardEmbed], ephemeral: true });
    }
};
