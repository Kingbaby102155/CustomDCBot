const TABLE = 'economy_shop';

/*
 * Moves the primary key from `name` to `id`. SQLite has no `ALTER TABLE ... DROP PRIMARY KEY`, so
 * this rebuilds the table; pre-V1 rows reuse `name` as their `id`. No-ops when `id` already exists.
 */
module.exports = {
    tables: [TABLE],
    up: async ({
                   context: {
                       queryInterface,
                       sequelize
                   }
               }) => {
        const description = await queryInterface.describeTable(TABLE).catch(() => ({}));
        if (description.id) return;

        await sequelize.transaction(async (transaction) => {
            await sequelize.query(`CREATE TABLE "${TABLE}_new" (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                price INTEGER,
                role TEXT,
                "createdAt" DATETIME,
                "updatedAt" DATETIME
            )`, {transaction});

            await sequelize.query(`INSERT INTO "${TABLE}_new" (id, name, price, role, "createdAt", "updatedAt")
                SELECT name, name, price, role, "createdAt", "updatedAt" FROM "${TABLE}"`, {transaction});

            await sequelize.query(`DROP TABLE "${TABLE}"`, {transaction});
            await sequelize.query(`ALTER TABLE "${TABLE}_new" RENAME TO "${TABLE}"`, {transaction});
        });
    },
    down: async () => {
        // No-op: restore from migration-backups/ instead.
    }
};