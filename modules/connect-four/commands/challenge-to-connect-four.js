const {localize} = require('../../../src/functions/localize');
const {memberCanSendInChannel} = require('../../../src/functions/helpers');
const connectFourCommand = require('./connect-four');

module.exports.config = {
    name: 'Challenge to Connect Four',
    type: 'USER',
    contextMenu: true,
    description: localize('connect-four', 'challenge-to-connect-four-context-description')
};

module.exports.run = async function (interaction) {
    if (!memberCanSendInChannel(interaction.member, interaction.channel)) return interaction.reply({
        ephemeral: true,
        content: '⚠️ ' + localize('command', 'no-send-permission')
    });
    const proxy = Object.create(interaction, {
        options: {
            value: {
                ...interaction.options,
                getMember: (name) => (name === 'user' ? interaction.targetMember : interaction.options.getMember(name)),
                getInteger: (name) => (name === 'field_size' ? null : interaction.options.getInteger(name))
            }
        }
    });
    return connectFourCommand.run(proxy);
};
