export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const tablePageSize = 10

export type PageSearchParams = {
  page?: string | string[]
  pageSize?: string | string[]
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export function pageFromSearchParams(params: PageSearchParams) {
  return Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1)
}
