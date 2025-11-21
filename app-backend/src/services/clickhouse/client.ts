import { URLSearchParams } from 'node:url'

type QueryParamValue = string | number | boolean

const CLICKHOUSE_URL =
  process.env.CLICKHOUSE_URL?.trim() || 'https://clickhouse-infra.originstake.com'
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER?.trim() || 'vector'
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD?.trim() || 'vector_pass'
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE?.trim() || 'originstake'
const DEFAULT_TIMEOUT_MS = Number(process.env.CLICKHOUSE_TIMEOUT_MS ?? 10_000)

export class ClickHouseError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ClickHouseError'
  }
}

const serializeParamValue = (value: QueryParamValue): string => {
  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }

  return String(value)
}

export const executeQuery = async <T>(
  query: string,
  params: Record<string, QueryParamValue> = {}
): Promise<T[]> => {
  const searchParams = new URLSearchParams({
    database: CLICKHOUSE_DATABASE,
    default_format: 'JSONEachRow',
  })

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(`param_${key}`, serializeParamValue(value))
    }
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS).unref()

  try {
    const response = await fetch(`${CLICKHOUSE_URL}?${searchParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'X-ClickHouse-User': CLICKHOUSE_USER,
        'X-ClickHouse-Key': CLICKHOUSE_PASSWORD,
      },
      body: query,
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new ClickHouseError(
        `ClickHouse responded with ${response.status}: ${errorBody}`,
        response.status
      )
    }

    const payload = await response.text()
    const rows = payload
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T)

    return rows
  } catch (error) {
    if (error instanceof ClickHouseError) {
      throw error
    }

    if ((error as Error).name === 'AbortError') {
      throw new ClickHouseError('ClickHouse request timed out')
    }

    throw new ClickHouseError((error as Error).message)
  } finally {
    clearTimeout(timeout)
  }
}

export const toDateTimeParam = (date: Date): string => date.toISOString()

