import type { FC } from 'react'

interface FilterState {
  name: string
  dateRange: string
  project: string
  organization: string
  starred: string
  operated: string
  [key: string]: string
}

interface FilterStats {
  total: number
  filtered: number
  hasActiveFilters: boolean
  activeFilterCount: number
}

interface FullExportCardFilterProps {
  filters: FilterState
  availableProjects?: unknown[]
  availableOrganizations?: unknown[]
  filterStats?: FilterStats
  onFilterChange: (key: string, value: string) => void
  onReset?: () => void
  onClearAllMarks?: () => void
  onExportProject?: () => void
  onImportProject?: () => void
  onRestoreStars?: () => void
  operatedCount?: number
  disabled?: boolean
  className?: string
  sortField?: string
  sortOrder?: string
  onSortChange?: ((field: string, order: string) => void) | null
}

declare const FullExportCardFilter: FC<FullExportCardFilterProps>
export default FullExportCardFilter
