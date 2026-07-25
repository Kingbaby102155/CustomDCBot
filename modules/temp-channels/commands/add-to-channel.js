const {localize} = require('../../../src/functions/localize');
const {embedType} = require('../../../src/functions/helpers');
const {
    userAdd,
    resolveOwnedTempChannel
} = require('../channel-settings');

module.exports.config = {
    name: 'Add to Channel',
    type: 'USER',
    contextMenu: true,
    description: localize('temp-channels', 'add-to-channel-context-description')
};

module.exports.run = async function (interaction) {
    await interaction.deferReply({ephemeral: true});
    const vc = await resolveOwnedTempChannel(interaction, 'context');
    if (!vc) return interaction.editReply(embedType(interaction.client.configurations['temp-channels']['config']['notInChannel'], {}, {ephemeral: true}));
    return userAdd(interaction, 'context');
};