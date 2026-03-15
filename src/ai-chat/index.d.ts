import type { FC } from 'react'

export declare const FloatPanel: FC
export declare const FloatPanelTrigger: FC<{ position?: string }>
export declare function initLyraAIChat(config?: Record<string, unknown>): void
export declare function openPanel(): void
export declare function closePanel(): void
export declare function togglePanel(): void
export declare function addBrowsingContext(message: unknown): void
export declare function clearBrowsingContext(from: number, to: number): void
export declare function recordBranchSwitch(from: string, to: string): void
