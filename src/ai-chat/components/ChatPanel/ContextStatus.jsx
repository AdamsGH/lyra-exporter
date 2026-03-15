/**
 * Lyra AI Chat - Context Status Component
 * 上下文状态显示组件
 */

import React, { useState } from 'react'
import { Badge, IconButton, IconTrash, IconRefresh, IconClose } from '../Common/index.jsx'
import { useContextStore } from '../../hooks/index'
import { contextActions } from '../../store/index'
import { useI18n } from '../../../index'

/**
 * 估算token数量（简化算法）
 * @param {import('../../types').ContextMessage[]} messages
 * @returns {number}
 */
function estimateTokens(messages) {
  if (!messages || messages.length === 0) return 0

  // 简单估算：每4个字符约1个token
  const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0)
  return Math.ceil(totalChars / 4)
}

/**
 * 上下文状态组件
 */
export function ContextStatus({ onClear, onRefresh, onManage }) {
  const { t } = useI18n()
  const { activeContext, browsingPath, clearAll } = useContextStore()
  const [showDetail, setShowDetail] = useState(false)

  const messageCount = activeContext.length
  const tokenCount = estimateTokens(activeContext)
  const pathCount = browsingPath.length

  const handleClear = () => {
    clearAll()
    onClear?.()
  }

  const handleManage = () => {
    setShowDetail(true)
    onManage?.()
  }

  if (messageCount === 0) {
    return (
      <div className="lyra-context-status lyra-context-status--empty">
        <span className="lyra-context-status__text">
          {t('aiChat.context.empty')}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="lyra-context-status">
        <div
          className="lyra-context-status__info"
          onClick={handleManage}
          style={{ cursor: 'pointer' }}
          title={t('aiChat.context.detailsTitle')}
        >
          <Badge variant="info">
            {t('aiChat.context.messages', { count: messageCount })}
          </Badge>
          <Badge variant="secondary">
            {t('aiChat.context.tokens', { count: tokenCount })}
          </Badge>
          {pathCount > 0 && (
            <Badge variant="default">
              {t('aiChat.context.steps', { count: pathCount })}
            </Badge>
          )}
        </div>
        <div className="lyra-context-status__actions">
          {onRefresh && (
            <IconButton
              icon={<IconRefresh size={14} />}
              onClick={onRefresh}
              title={t('aiChat.context.refresh')}
              size="sm"
            />
          )}
          <IconButton
            icon={<IconTrash size={14} />}
            onClick={handleClear}
            title={t('aiChat.context.clear')}
            size="sm"
          />
        </div>
      </div>

      {showDetail && (
        <ContextDetail
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}

/**
 * 上下文详情展开组件
 */
export function ContextDetail({ isOpen, onClose }) {
  const { t } = useI18n()
  const { activeContext, browsingPath, summaries } = useContextStore()
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customContent, setCustomContent] = useState('')
  const [customLabel, setCustomLabel] = useState('')

  if (!isOpen) return null

  const handleRemoveMessage = (uuid) => {
    contextActions.removeFromContext(uuid)
  }

  const handleAddCustom = () => {
    if (customContent.trim()) {
      contextActions.addCustomContent({
        content: customContent.trim(),
        label: customLabel.trim() || t('aiChat.context.customLabel') || '用户补充'
      })
      setCustomContent('')
      setCustomLabel('')
      setShowAddCustom(false)
    }
  }

  // 按分支分组消息
  const groupedByBranch = activeContext.reduce((acc, msg) => {
    const branch = msg.branch || 'main'
    if (!acc[branch]) {
      acc[branch] = []
    }
    acc[branch].push(msg)
    return acc
  }, {})

  const branches = Object.keys(groupedByBranch)

  const handleClearBranch = (branchId) => {
    // 找到该分支的最小索引，保留之前的公共消息
    const branchMessages = groupedByBranch[branchId]
    if (branchMessages && branchMessages.length > 0) {
      const minIndex = Math.min(...branchMessages.map(m => m.index))
      contextActions.clearBranch(branchId, minIndex)
    }
  }

  return (
    <div className="lyra-context-detail-overlay" onClick={onClose}>
      <div className="lyra-context-detail" onClick={e => e.stopPropagation()}>
        <div className="lyra-context-detail__header">
          <h4>{t('aiChat.context.detailsTitle')}</h4>
          <IconButton
            icon={<IconClose size={14} />}
            onClick={onClose}
            size="sm"
          />
        </div>

        <div className="lyra-context-detail__body">
          {/* 消息列表 - 按分支分组 */}
          <div className="lyra-context-detail__section">
            <div className="lyra-context-detail__section-header">
              <h5>{t('aiChat.context.browsingMessages')} ({activeContext.length})</h5>
              <button
                className="lyra-btn lyra-btn--sm lyra-btn--secondary"
                onClick={() => setShowAddCustom(!showAddCustom)}
              >
                {showAddCustom ? '取消' : '+ 添加内容'}
              </button>
            </div>

            {/* 添加自定义内容表单 */}
            {showAddCustom && (
              <div className="lyra-context-detail__add-form">
                <input
                  type="text"
                  className="lyra-input lyra-input--sm"
                  placeholder="标签（如：背景信息、用户总结）"
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                />
                <textarea
                  className="lyra-textarea lyra-textarea--sm"
                  placeholder="输入要添加的内容..."
                  value={customContent}
                  onChange={e => setCustomContent(e.target.value)}
                  rows={3}
                />
                <button
                  className="lyra-btn lyra-btn--sm lyra-btn--primary"
                  onClick={handleAddCustom}
                  disabled={!customContent.trim()}
                >
                  添加
                </button>
              </div>
            )}

            {/* 按分支显示 */}
            <div className="lyra-context-detail__branches">
              {branches.map(branchId => (
                <div key={branchId} className="lyra-context-detail__branch">
                  <div className="lyra-context-detail__branch-header">
                    <span className="lyra-context-detail__branch-name">
                      {branchId === 'main' ? '主分支' : branchId === 'custom' ? '自定义' : `分支 ${branchId}`}
                    </span>
                    <span className="lyra-context-detail__branch-count">
                      ({groupedByBranch[branchId].length})
                    </span>
                    {branchId !== 'custom' && branches.length > 1 && (
                      <button
                        className="lyra-btn lyra-btn--xs lyra-btn--danger"
                        onClick={() => handleClearBranch(branchId)}
                        title={`清理 ${branchId} 分支`}
                      >
                        清理分支
                      </button>
                    )}
                  </div>
                  <div className="lyra-context-detail__list">
                    {groupedByBranch[branchId].map((msg, idx) => (
                      <div key={msg.uuid || idx} className="lyra-context-detail__item">
                        <span className="lyra-context-detail__index">
                          {msg.isCustom ? '📝' : `#${msg.index}`}
                        </span>
                        <span className="lyra-context-detail__sender">
                          {msg.sender === 'human' ? '👤' : msg.sender === 'user_custom' ? '✏️' : '🤖'}
                        </span>
                        <span className="lyra-context-detail__preview">
                          {msg.label && <strong>[{msg.label}] </strong>}
                          {msg.content?.substring(0, 50)}...
                        </span>
                        <IconButton
                          icon={<IconClose size={12} />}
                          onClick={() => handleRemoveMessage(msg.uuid)}
                          title={t('aiChat.context.remove')}
                          size="xs"
                          className="lyra-context-detail__remove"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {activeContext.length === 0 && (
                <div className="lyra-context-detail__empty">
                  {t('aiChat.context.empty')}
                </div>
              )}
            </div>
          </div>

          {/* 浏览轨迹 */}
          <div className="lyra-context-detail__section">
            <h5>{t('aiChat.context.browsingPath')} ({browsingPath.length})</h5>
            <div className="lyra-context-detail__list lyra-context-detail__list--compact">
              {browsingPath.slice(-10).map((entry, idx) => (
                <div key={idx} className="lyra-context-detail__item lyra-context-detail__item--path">
                  <span className="lyra-context-detail__action">
                    {entry.action === 'view' && '👁️'}
                    {entry.action === 'switch_branch' && '🔀'}
                    {entry.action === 'clear' && '🗑️'}
                    {entry.action === 'clear_branch' && '🧹'}
                    {entry.action === 'remove' && '❌'}
                    {entry.action === 'add_custom' && '📝'}
                  </span>
                  <span className="lyra-context-detail__detail">
                    {entry.action === 'view' && `消息 #${entry.index}`}
                    {entry.action === 'switch_branch' && `${entry.from} → ${entry.to}`}
                    {entry.action === 'clear' && `清理 ${entry.clearedRange?.length || 0} 条`}
                    {entry.action === 'clear_branch' && `清理分支 ${entry.branchId} (${entry.clearedCount} 条)`}
                    {entry.action === 'remove' && `移除消息`}
                    {entry.action === 'add_custom' && `添加 ${entry.label}`}
                  </span>
                  <span className="lyra-context-detail__time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {browsingPath.length === 0 && (
                <div className="lyra-context-detail__empty">
                  暂无浏览轨迹
                </div>
              )}
            </div>
          </div>

          {/* 摘要 */}
          {summaries.length > 0 && (
            <div className="lyra-context-detail__section">
              <h5>{t('aiChat.context.summaries')} ({summaries.length})</h5>
              <div className="lyra-context-detail__list">
                {summaries.map((s, idx) => (
                  <div key={idx} className="lyra-context-detail__item">
                    <span className="lyra-context-detail__summary">
                      {s.summary.substring(0, 100)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContextStatus
