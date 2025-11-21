export const getQueryValue = (
  query: Record<string, string | string[]>,
  key: string
): string | undefined => {
  const value = query[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

