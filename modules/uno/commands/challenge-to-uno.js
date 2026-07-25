const {localize} = require('../../../src/functions/localize');
const {memberCanSendInChannel} = require('../../../src/functions/helpers');
const unoCommand = require('./uno');

module.exports.config = {
    name: 'Challenge to Uno',
    type: 'USER',
    contextMenu: true,
    description: localize('uno', 'challenge-to-uno-context-description')
};

module.exports.run = async function (interaction) {
    if (!memberCanSendInChannel(interaction.member, interaction.channel)) return interaction.reply({
        ephemeral: true,
        content: '⚠️ ' + localize('command', 'no-send-permission')
    });
    await unoCommand.run(interaction);
    if (interaction.targetUser && interaction.targetUser.id !== interaction.user.id) {
        await interaction.followUp({
            content: localize('uno', 'context-challenge-invite', {
                u: interaction.user.toString(),
                t: interaction.targetUser.toString()
            }),
            allowedMentions: {users: [interaction.targetUser.id]}
        }).catch(() => {
        });
    }
};