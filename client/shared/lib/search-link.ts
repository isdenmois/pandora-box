export const searchLink = (query: string) => {
  return `${import.meta.env.VITE_SEARCH_URL}${encodeURIComponent(query.toLowerCase())}`
}
