export const searchLink = (query: string) => {
  return `${import.meta.env.VITE_SEARCH_URL}${query.toLowerCase()}`
}
