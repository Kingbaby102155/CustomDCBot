const {localize} = require('../../../src/functions/localize');
const {generateActionsResponse} = require('../ping-protection');
const {MessageFlags} = require('discord.js');

module.exports.config = {
    name: 'View Moderation History',
    type: 'USER',
    contextMenu: true,
    defaultMemberPermissions: ['MODERATE_MEMBERS'],
    description: localize('ping-protection', 'view-moderation-history-description')
};

module.exports.run = async function (interaction) {
    const payload = await generateActionsResponse(interaction.client, interaction.targetUser.id, 1);
    return interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
    });
};
