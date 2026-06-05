import { useState, useMemo, useEffect } from 'react'

export function usePagination<T>(data: T[], pageSize: number) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [data])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, page, pageSize])

  return { paged, page, setPage, total: data.length }
}
