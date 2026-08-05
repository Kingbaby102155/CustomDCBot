// modules/tickets/commands/ticketpanel.js
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

module.exports = {
    name: 'ticketpanel',
    description: 'Manage and modify the live ticket module settings directly through Discord.',
    category: 'Tickets',
    async execute(message, args, client) {
        // 1. Validate Admin Execution Roles
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('Only server administrators can modify the ticket engine config.');
        }

        const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // 2. Process Commands if Arguments exist
        if (args && args.length >= 2) {
            const action = args[0].toLowerCase();

            // --- GLOBAL CONFIG OPTIONS ---
            if (action === 'mode') {
                const targetMode = args[1].toUpperCase();
                if (targetMode !== 'BUTTONS' && targetMode !== 'DROPDOWN') {
                    return message.reply('Specify either `BUTTONS` or `DROPDOWN`.');
                }
                currentConfig.mode = targetMode;
            } else if (action === 'title') {
                currentConfig.panel.title = args.slice(1).join(' ');
            } else if (action === 'desc') {
                currentConfig.panel.description = args.slice(1).join(' ');
            } else if (action === 'max') {
                const num = parseInt(args[1], 10);
                if (isNaN(num)) return message.reply('Provide a valid number value.');
                currentConfig.max_open_tickets = num;

            // --- CATEGORY CONFIGURATION ---
            } else if (action === 'addcat') {
                if (args.length < 5) return message.reply('Syntax: `!ticketpanel addcat [id] [category_id] [emoji] [label text...]`');
                const catId = args[1].toLowerCase();
                const parentId = args[2];
                const emoji = args[3];
                const label = args.slice(4).join(' ');

                if (currentConfig.categories.some(c => c.id === catId)) {
                    return message.reply('A category with that ID already exists.');
                }

                currentConfig.categories.push({
                    id: catId,
                    label: label,
                    description: 'No description provided.',
                    emoji: emoji,
                    category_id: parentId,
                    custom_staff_role: currentConfig.staff_role_id,
                    questions: []
                });
            } else if (action === 'delcat') {
                const targetId = args[1].toLowerCase();
                const index = currentConfig.categories.findIndex(c => c.id === targetId);
                if (index === -1) return message.reply(`Category \`${targetId}\` was not found.`);
                currentConfig.categories.splice(index, 1);
            } else if (action === 'catrole') {
                if (args.length < 3) return message.reply('Syntax: `!ticketpanel catrole [cat_id] [role_id]`');
                const catId = args[1].toLowerCase();
                const roleId = args[2].replace(/[<@&>]/g, '');

                const category = currentConfig.categories.find(c => c.id === catId);
                if (!category) return message.reply(`Category \`${catId}\` not found.`);
                category.custom_staff_role = roleId;

            // --- IN-MODAL QUESTIONNAIRES ---
            } else if (action === 'addquestion') {
                if (args.length < 5) return message.reply('Syntax: `!ticketpanel addquestion [cat_id] [q_id] [SHORT|PARAGRAPH] [label text]`');
                const catId = args[1].toLowerCase();
                const qId = args[2].toLowerCase();
                const style = args[3].toUpperCase();
                const label = args.slice(4).join(' ');

                if (style !== 'SHORT' && style !== 'PARAGRAPH') return message.reply('Style options are `SHORT` or `PARAGRAPH`.');

                const category = currentConfig.categories.find(c => c.id === catId);
                if (!category) return message.reply(`Category \`${catId}\` not found.`);
                if (category.questions.some(q => q.id === qId)) return message.reply('Question ID already exists inside this category.');

                category.questions.push({
                    id: qId,
                    label: label,
                    style: style,
                    required: true,
                    placeholder: 'Enter response details here...',
                    min_length: 1,
                    max_length: 500
                });
            } else if (action === 'setplaceholder') {
                if (args.length < 4) return message.reply('Syntax: `!ticketpanel setplaceholder [cat_id] [q_id] [placeholder text...]`');
                const catId = args[1].toLowerCase();
                const qId = args[2].toLowerCase();
                const placeholder = args.slice(3).join(' ');

                const category = currentConfig.categories.find(c => c.id === catId);
                if (!category) return message.reply('Category not found.');
                const question = category.questions.find(q => q.id === qId);
                if (!question) return message.reply('Question not found inside that category.');

                question.placeholder = placeholder;

            // --- ALERTS & GREETINGS ---
            } else if (action === 'alerttitle') {
                currentConfig.staff_alert.title = args.slice(1).join(' ');
            } else if (action === 'alertdesc') {
                currentConfig.staff_alert.description = args.slice(1).join(' ');
            } else if (action === 'alertchannel') {
                currentConfig.staff_alert.channel_id = args[1].replace(/[<#>]/g, '');
            } else if (action === 'welcometitle') {
                currentConfig.welcome_message.title = args.slice(1).join(' ');
            } else if (action === 'welcomedesc') {
                currentConfig.welcome_message.description = args.slice(1).join(' ');

            // --- INACTIVITY MANAGEMENT TIMERS ---
            } else if (action === 'warnminutes') {
                const num = parseInt(args[1], 10);
                if (isNaN(num)) return message.reply('Provide a valid countdown number.');
                currentConfig.inactivity_system.warn_after_minutes = num;
            } else if (action === 'closeminutes') {
                const num = parseInt(args[1], 10);
                if (isNaN(num)) return message.reply('Provide a valid closing timer number.');
                currentConfig.inactivity_system.close_after_minutes = num;
            } else if (action === 'warnmsg') {
                currentConfig.inactivity_system.warn_message = args.slice(1).join(' ');
            } else if (action === 'closemsg') {
                currentConfig.inactivity_system.close_message = args.slice(1).join(' ');
            } else {
                return message.reply('Unknown command action parameter passed.');
            }

            // Save updates back to the configuration file
            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
            return message.reply(`✅ System configuration updated for action **${action}**!`);
        }

        // Handle a simple toggle switch like !ticketpanel toggleinactivity
        if (args && args.length === 1 && args[0].toLowerCase() === 'toggleinactivity') {
            currentConfig.inactivity_system.enabled = !currentConfig.inactivity_system.enabled;
            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
            return message.reply(`Inactivity auto-cleanup is now **${currentConfig.inactivity_system.enabled ? 'ENABLED' : 'DISABLED'}**.`);
        }

        // 3. Status View Dashboard Layout
        const dashboardEmbed = new EmbedBuilder()
            .setTitle('⚙️ System Panel Configuration Overview')
            .setColor('#2ecc71')
            .setDescription(`**Active Mode:** \`${currentConfig.mode}\` | **Max Limits:** \`${currentConfig.max_open_tickets}\` tickets\n**Inactivity Cleanup:** \`${currentConfig.inactivity_system?.enabled ? 'ENABLED' : 'DISABLED'}\``)
            .addFields(
                { name: '🔔 Staff Alert Channel', value: `<#${currentConfig.staff_alert?.channel_id || 'Not Set'}>`, inline: true },
                { name: '👋 Ticket Welcome Title', value: `*${currentConfig.welcome_message?.title || 'Default'}*`, inline: false }
            )
            .setTimestamp();

        if (currentConfig.categories && currentConfig.categories.length > 0) {
            currentConfig.categories.forEach(cat => {
                const formsList = cat.questions.map(q => `• \`${q.id}\` (${q.style}): *"${q.label}"*`).join('\n') || '*None configured*';
                dashboardEmbed.addFields({
                    name: `${cat.emoji || '🎫'} ${cat.label} (ID: \`${cat.id}\`)`,
                    value: `**Target Category ID:** \`${cat.category_id}\` | **Handling Role:** <@&${cat.custom_staff_role}>\n**Forms:**\n${formsList}`,
                    inline: false
                });
            });
        } else {
            dashboardEmbed.addFields({ name: 'Categories', value: '*No support categories set up yet. Use `!ticketpanel addcat`*' });
        }

        await message.channel.send({ embeds: [dashboardEmbed] });
    }
};
