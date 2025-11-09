export function formatDate(date: string | number): string {
  return new Date(date).toLocaleDateString('ru')
}
