const {localize} = require('../../../src/functions/localize');
const {MessageFlags} = require('discord.js');
const {
    isSupervisor,
    buildPromoteSelect
} = require('../context-actions');

module.exports.config = {
    name: 'Promote User',
    type: 'USER',
    contextMenu: true,
    defaultMemberPermissions: ['MANAGE_GUILD'],
    description: localize('staff-management-system', 'promote-user-context-description')
};

module.exports.run = async function (interaction) {
    if (!isSupervisor(interaction.client, interaction.member)) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-perm'),
        flags: MessageFlags.Ephemeral
    });
    return interaction.reply(buildPromoteSelect(interaction.targetUser.id));
};