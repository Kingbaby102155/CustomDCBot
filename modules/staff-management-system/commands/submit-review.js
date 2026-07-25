const {localize} = require('../../../src/functions/localize');
const {buildReviewModal} = require('../context-actions');

module.exports.config = {
    name: 'Submit Review',
    type: 'USER',
    contextMenu: true,
    description: localize('staff-management-system', 'submit-review-context-description')
};

module.exports.run = async function (interaction) {
    return interaction.showModal(buildReviewModal(interaction.targetUser.id));
};
