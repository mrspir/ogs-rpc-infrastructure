import { executeQuery } from "./client";

type ColumnRow = {
  name: string;
  type: string;
  default_kind?: string;
  comment?: string;
};

const DEFAULT_DATABASE =
  process.env.CLICKHOUSE_DATABASE?.trim() || "originstake";

const parseTableReference = (tableRef: string) => {
  if (tableRef.includes(".")) {
    const [database, table] = tableRef.split(".", 2);
    return { database, table };
  }

  return { database: DEFAULT_DATABASE, table: tableRef };
};

export const getTableSchema = async (tableRef: string) => {
  const { database, table } = parseTableReference(tableRef);

  const rows = await executeQuery<ColumnRow>(
    `
    SELECT
      name,
      type,
      default_kind,
      comment
    FROM system.columns
    WHERE table = {table:String}
      AND database = {database:String}
    ORDER BY position
    `,
    {
      table,
      database,
    }
  );

  return rows.map((row) => ({
    name: row.name,
    type: row.type,
    defaultKind: row.default_kind ?? null,
    comment: row.comment ?? null,
  }));
};
