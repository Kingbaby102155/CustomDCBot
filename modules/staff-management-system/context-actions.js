const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder,
    RoleSelectMenuBuilder,
    MessageFlags
} = require('discord.js');
const {localize} = require('../../src/functions/localize');
const {
    getConfig,
    checkStaffPermissions,
    issueInfraction,
    promoteUser,
    submitReview
} = require('./staff-management');

/*
 * Shared core for the staff-management USER context-menu commands, routing submitted modal/select
 * data into the same cores the slash subcommands call. Those cores defer and editReply themselves,
 * so neither the run() adapters nor the submit handlers may defer first.
 */

const SUPERVISOR = 'supervisor';

// True when the member passes the module's runtime SUPERVISOR gate (NOT a Discord permission).
function isSupervisor(client, member) {
    return checkStaffPermissions(member, getConfig(client, 'configuration'), SUPERVISOR);
}

// Modal interactions have no interaction.options, but promoteUser reads getChannel('channel').
function withOptionsShim(interaction) {
    return new Proxy(interaction, {
        get(target, prop) {
            if (prop === 'options') return {getChannel: () => null};
            const value = target[prop];
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
}

function buildInfractionModal(client, userId) {
    const types = getConfig(client, 'infractions')?.infractionTypes || [];
    const selectable = types.filter(infractionType => infractionType.toLowerCase() !== 'suspension');

    /*
     * Discord rejects a string-select with zero options, so a misconfigured (empty) infraction
     * list would make showModal throw. Signal the caller to reply with an error instead.
     */
    if (selectable.length === 0) return null;
    const modal = new ModalBuilder()
        .setCustomId(`staff-mgmt_ctx-infract_${userId}`)
        .setTitle(localize('staff-management-system', 'ctx-infract-title'));

    const typeLabel = new LabelBuilder()
        .setLabel(localize('staff-management-system', 'ctx-infract-type-label'))
        .setStringSelectMenuComponent(c => {
            c.setCustomId('type');
            for (const infractionType of selectable) {
                c.addOptions({
                    label: infractionType,
                    value: infractionType
                });
            }
            return c;
        });

    const reasonRow = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('reason')
            .setLabel(localize('staff-management-system', 'ctx-infract-reason-label'))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
    );
    const expiryRow = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('expiry')
            .setLabel(localize('staff-management-system', 'ctx-infract-expiry-label'))
            .setPlaceholder(localize('staff-management-system', 'ctx-infract-expiry-placeholder'))
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
    );

    modal.addComponents(typeLabel, reasonRow, expiryRow);
    return modal;
}

async function handleInfractionModal(client, interaction, userId) {
    if (!isSupervisor(client, interaction.member)) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-perm'),
        flags: MessageFlags.Ephemeral
    });
    const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!targetMember) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-user'),
        flags: MessageFlags.Ephemeral
    });
    const type = interaction.fields.getStringSelectValues('type')[0];
    const reason = interaction.fields.getTextInputValue('reason');
    const expiry = interaction.fields.getTextInputValue('expiry');
    return issueInfraction(client, interaction, targetMember, type, reason, expiry || null);
}

function buildPromoteSelect(userId) {
    return {
        flags: MessageFlags.Ephemeral,
        content: localize('staff-management-system', 'ctx-promote-prompt'),
        components: [
            new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`staff-mgmt_ctx-promote_${userId}`)
                    .setPlaceholder(localize('staff-management-system', 'ctx-promote-placeholder'))
                    .setMinValues(1)
                    .setMaxValues(1)
            )
        ]
    };
}

async function handlePromoteSelect(client, interaction, userId) {
    if (!isSupervisor(client, interaction.member)) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-perm'),
        flags: MessageFlags.Ephemeral
    });
    const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!targetMember) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-user'),
        flags: MessageFlags.Ephemeral
    });
    const role = interaction.roles.first() || interaction.guild.roles.cache.get(interaction.values[0]);
    if (!role) return interaction.reply({
        content: localize('staff-management-system', 'ctx-promote-no-role'),
        flags: MessageFlags.Ephemeral
    });
    return promoteUser(client, withOptionsShim(interaction), targetMember, role, null);
}

function buildReviewModal(userId) {
    const modal = new ModalBuilder()
        .setCustomId(`staff-mgmt_ctx-review_${userId}`)
        .setTitle(localize('staff-management-system', 'ctx-review-title'));
    const starsRow = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('stars')
            .setLabel(localize('staff-management-system', 'ctx-review-stars-label'))
            .setPlaceholder(localize('staff-management-system', 'ctx-review-stars-placeholder'))
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
    );
    const commentRow = new ActionRowBuilder().addComponents(
        new TextInputBuilder()
            .setCustomId('comment')
            .setLabel(localize('staff-management-system', 'ctx-review-comment-label'))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
    );
    modal.addComponents(starsRow, commentRow);
    return modal;
}

async function handleReviewModal(client, interaction, userId) {
    const targetUser = await client.users.fetch(userId).catch(() => null);
    if (!targetUser) return interaction.reply({
        content: localize('staff-management-system', 'err-gen-no-user'),
        flags: MessageFlags.Ephemeral
    });
    const starsRaw = interaction.fields.getTextInputValue('stars').trim();
    const stars = parseInt(starsRaw, 10);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return interaction.reply({
        content: localize('staff-management-system', 'ctx-review-invalid-stars'),
        flags: MessageFlags.Ephemeral
    });
    const comment = interaction.fields.getTextInputValue('comment');
    return submitReview(client, interaction, targetUser, stars, comment);
}

module.exports = {
    isSupervisor,
    withOptionsShim,
    buildInfractionModal,
    handleInfractionModal,
    buildPromoteSelect,
    handlePromoteSelect,
    buildReviewModal,
    handleReviewModal
};