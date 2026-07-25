const {localize} = require('../../../src/functions/localize');
const {MessageFlags} = require('discord.js');
const {handleProfileView} = require('./staff-management');

module.exports.config = {
    name: 'View Staff Profile',
    type: 'USER',
    contextMenu: true,
    description: localize('staff-management-system', 'view-staff-profile-description')
};

module.exports.run = async function (interaction) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });
    return handleProfileView(interaction.client, interaction, interaction.targetUser);
};
