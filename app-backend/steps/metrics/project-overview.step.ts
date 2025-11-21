import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { metricsService } from '../../src/services/metrics'
import { getQueryValue } from '../../src/utils/http'

const querySchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
})

const responseSchema = z.object({
  projectId: z.string(),
  requests30d: z.number(),
  requests24h: z.number(),
  currentRps: z.number(),
  updatedAt: z.string(),
  topChains: z.array(
    z.object({
      chain: z.string(),
      requests: z.number(),
    })
  ),
})

export const config: ApiRouteConfig = {
  name: 'GetProjectMetricsOverview',
  type: 'api',
  method: 'GET',
  path: '/metrics/projects/overview',
  description: 'Fetch project specific metrics summary',
  emits: [],
  flows: ['metrics-dashboard'],
  responseSchema: {
    200: responseSchema,
    404: z.object({
      error: z.literal('project_not_found'),
      message: z.string(),
    }),
  },
}

export const handler: Handlers['GetProjectMetricsOverview'] = async (req, { logger }) => {
  const rawQuery = {
    projectId: getQueryValue(req.queryParams, 'projectId'),
  }

  const query = querySchema.parse(rawQuery)

  logger.info('Fetching project overview metrics', { projectId: query.projectId })

  const overview = await metricsService.getProjectOverview(query.projectId)

  if (!overview) {
    return {
      status: 404,
      body: {
        error: 'project_not_found',
        message: `No metrics found for projectId=${query.projectId}`,
      },
    }
  }

  return {
    status: 200,
    body: overview,
  }
}

