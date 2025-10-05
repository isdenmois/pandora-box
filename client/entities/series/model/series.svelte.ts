import { api, type Series, type SeriesCreate } from '@/shared/api'

class SeriesModel {
  all = $state.raw<Series[]>([])
  isLoading = $state(false)

  async refresh() {
    this.isLoading = true

    try {
      this.all = await api.series.getAll()
    } finally {
      this.isLoading = false
    }
  }

  async create(data: SeriesCreate) {
    const series = await api.series.create(data)

    this.all = [...this.all, series]
  }
}

export const series = new SeriesModel()
