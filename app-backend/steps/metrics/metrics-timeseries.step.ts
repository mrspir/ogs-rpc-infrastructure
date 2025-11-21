import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { metricsService } from '../../src/services/metrics'
import { getQueryValue } from '../../src/utils/http'

const allowedResolutions = ['5s', '1m', '5m'] as const

const querySchema = z.object({
  chain: z.string(),
  env: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  resolution: z.enum(allowedResolutions).default('1m'),
})

const responseSchema = z.object({
  chain: z.string(),
  env: z.string(),
  resolution: z.enum(allowedResolutions),
  points: z.array(
    z.object({
      ts: z.string(),
      requests: z.number(),
      errors: z.number(),
      latencyP95: z.number(),
    })
  ),
})

export const config: ApiRouteConfig = {
  name: 'GetMetricsTimeseries',
  type: 'api',
  method: 'GET',
  path: '/metrics/timeseries',
  description: 'Fetch chart-friendly timeseries metrics',
  emits: [],
  flows: ['metrics-dashboard'],
  responseSchema: {
    200: responseSchema,
  },
}

export const handler: Handlers['GetMetricsTimeseries'] = async (req, { logger }) => {
  const rawQuery = {
    chain: getQueryValue(req.queryParams, 'chain'),
    env: getQueryValue(req.queryParams, 'env'),
    from: getQueryValue(req.queryParams, 'from'),
    to: getQueryValue(req.queryParams, 'to'),
    resolution: getQueryValue(req.queryParams, 'resolution'),
  }

  const query = querySchema.parse(rawQuery)

  const fromDate = new Date(query.from)
  const toDate = new Date(query.to)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return {
      status: 400,
      body: { error: 'Invalid date range' },
    }
  }

  logger.info('Fetching metrics timeseries', query)

  const points = await metricsService.getTimeseries({
    chain: query.chain,
    env: query.env,
    from: fromDate,
    to: toDate,
    resolution: query.resolution,
  })

  return {
    status: 200,
    body: {
      chain: query.chain,
      env: query.env,
      resolution: query.resolution,
      points,
    },
  }
}

