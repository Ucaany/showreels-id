/**
 * Custom Error class untuk fetch operations
 */
export class FetchError extends Error {
  info: any
  status: number

  constructor(message: string, status: number, info?: any) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.info = info
  }
}

/**
 * Custom fetcher untuk SWR
 * Handles error responses dan parsing JSON
 * 
 * @param url - API endpoint URL
 * @param init - Fetch options
 * @returns Parsed JSON response
 * @throws FetchError jika response tidak ok
 */
export async function fetcher<T = any>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const info = await response.json().catch(() => null)
    throw new FetchError(
      info?.error || info?.message || 'An error occurred while fetching data',
      response.status,
      info
    )
  }

  return response.json()
}

/**
 * Fetcher untuk POST requests
 */
export async function postFetcher<T = any>(
  url: string,
  data: any
): Promise<T> {
  return fetcher<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Fetcher untuk PUT requests
 */
export async function putFetcher<T = any>(
  url: string,
  data: any
): Promise<T> {
  return fetcher<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Fetcher untuk PATCH requests
 */
export async function patchFetcher<T = any>(
  url: string,
  data: any
): Promise<T> {
  return fetcher<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Fetcher untuk DELETE requests
 */
export async function deleteFetcher<T = any>(url: string): Promise<T> {
  return fetcher<T>(url, {
    method: 'DELETE',
  })
}
