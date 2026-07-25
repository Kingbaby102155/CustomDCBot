const {localize} = require('../../../src/functions/localize');
const {generateHistoryResponse} = require('../ping-protection');
const {MessageFlags} = require('discord.js');

module.exports.config = {
    name: 'View Ping History',
    type: 'USER',
    contextMenu: true,
    defaultMemberPermissions: ['MODERATE_MEMBERS'],
    description: localize('ping-protection', 'view-ping-history-description')
};

module.exports.run = async function (interaction) {
    const payload = await generateHistoryResponse(interaction.client, interaction.targetUser.id, 1);
    return interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
    });
};
