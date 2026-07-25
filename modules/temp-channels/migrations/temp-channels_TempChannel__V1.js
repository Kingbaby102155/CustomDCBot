const OLD_TABLE = 'temp-channel_TempChannels';
const NEW_TABLE = 'temp-channel_TempChannelsv2';

// Copies V1 rows into the V2 table in one transaction. No-ops when the old table is absent.
module.exports = {
    tables: [OLD_TABLE, NEW_TABLE],
    up: async ({
                   context: {
                       queryInterface,
                       sequelize
                   }
               }) => {
        const allTables = await queryInterface.showAllTables();
        const tableSet = new Set(allTables.map(t => (typeof t === 'object' ? t.tableName : t)));
        const oldExists = tableSet.has(OLD_TABLE);
        const newExists = tableSet.has(NEW_TABLE);
        if (!oldExists || !newExists) return;

        await sequelize.transaction(async (transaction) => {
            await sequelize.query(
                `INSERT OR IGNORE INTO "${NEW_TABLE}" (id, "creatorID", "noMicChannel", "createdAt", "updatedAt")
                 SELECT id, "creatorID", "noMicChannel", "createdAt", "updatedAt" FROM "${OLD_TABLE}"`,
                {transaction}
            );
            await sequelize.query(`DELETE FROM "${OLD_TABLE}"`, {transaction});
        });
    },
    down: async () => {

        // No-op: copying rows back to a now-empty V1 schema is not a meaningful rollback.
    }
};