import type { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { getTableSchema } from "../../src/services/clickhouse/schema";

const responseSchema = z.object({
  table: z.string(),
  columns: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      defaultKind: z.string().nullable(),
      comment: z.string().nullable(),
    })
  ),
});

export const config: ApiRouteConfig = {
  name: "ListClickHouseTableSchema",
  type: "api",
  method: "GET",
  path: "/clickhouse/schema/rpc_logs",
  description: "Utility endpoint to inspect ClickHouse rpc_logs table schema",
  emits: [],
  flows: ["devtools"],
  responseSchema: {
    200: responseSchema,
  },
};

export const handler: Handlers["ListClickHouseTableSchema"] = async (
  _,
  { logger }
) => {
  const tableRef =
    process.env.CLICKHOUSE_LOGS_TABLE?.trim() || "originstake.rpc_logs";

  logger.info("Fetching ClickHouse schema", { table: tableRef });
  const columns = await getTableSchema(tableRef);

  return {
    status: 200,
    body: {
      table: tableRef,
      columns,
    },
  };
};
