import type { FC } from 'react'

interface FloatingActionButtonProps {
  onClick: () => void
  title?: string
  hidden?: boolean
}

declare const FloatingActionButton: FC<FloatingActionButtonProps>
export default FloatingActionButton
