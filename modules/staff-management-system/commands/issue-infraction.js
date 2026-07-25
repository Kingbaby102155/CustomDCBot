const {localize} = require('../../../src/functions/localize');
const {MessageFlags} = require('discord.js');
const {
    isSupervisor,
    buildInfractionModal
} = require('../context-actions');

module.exports.config = {
    name: 'Issue Infraction',
    type: 'USER',
    contextMenu: true,
    defaultMemberPermissions: ['MANAGE_GUILD'],
    description: localize('staff-management-system', 'issue-infraction-context-description')
};

module.exports.run = async function (interaction) {
    if (!isSupervisor(interaction.client, interaction.member)) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-perm'),
        flags: MessageFlags.Ephemeral
    });
    const modal = buildInfractionModal(interaction.client, interaction.targetUser.id);
    if (!modal) return interaction.reply({
        content: localize('staff-management-system', 'ctx-infract-no-types'),
        flags: MessageFlags.Ephemeral
    });
    return interaction.showModal(modal);
};