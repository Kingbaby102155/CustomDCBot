const {localize} = require('../../../src/functions/localize');
const {embedType} = require('../../../src/functions/helpers');
const {
    userRemove,
    resolveOwnedTempChannel
} = require('../channel-settings');

module.exports.config = {
    name: 'Remove from Channel',
    type: 'USER',
    contextMenu: true,
    description: localize('temp-channels', 'remove-from-channel-context-description')
};

module.exports.run = async function (interaction) {
    await interaction.deferReply({ephemeral: true});
    const vc = await resolveOwnedTempChannel(interaction, 'context');
    if (!vc) return interaction.editReply(embedType(interaction.client.configurations['temp-channels']['config']['notInChannel'], {}, {ephemeral: true}));
    return userRemove(interaction, 'context');
};