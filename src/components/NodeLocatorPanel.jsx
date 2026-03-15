// components/NodeLocatorPanel.js
// 节点定位面板 - 显示搜索结果和节点可视化

import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../index';
import { DateTimeUtils } from '../utils/fileParser';

/**
 * 节点定位面板主组件
 */
export default function NodeLocatorPanel({
  searchResults,
  onNodeClick,
  onClose,
  isLoading = false
}) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState(new Set());
  
  // 按对话分组搜索结果（而非按文件）
  const resultsByConversation = useMemo(() => {
    if (!searchResults?.results) return {};
    
    const grouped = {};
    searchResults.results.forEach(result => {
      // 使用对话 UUID 作为键
      const convKey = result.conversationUuid || result.fileUuid || result.fileId;
      if (!grouped[convKey]) {
        grouped[convKey] = {
          conversationId: result.conversationId,
          conversationName: result.conversationName || result.fileName,
          fileName: result.fileName,
          fileIndex: result.fileIndex,
          conversationUuid: result.conversationUuid,
          results: []
        };
      }
      grouped[convKey].results.push(result);
    });
    
    return grouped;
  }, [searchResults]);
  
  // 为了兼容，保留 resultsByFile 的引用（但实际是按对话分组）
  const resultsByFile = resultsByConversation;
  
  // 子分组：在每个对话下按消息分组（已经是消息列表，不需要再分组）
  
  const handleFileToggle = (fileId) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
      if (selectedFile === fileId) {
        setSelectedFile(null);
      }
    } else {
      newExpanded.add(fileId);
      setSelectedFile(fileId);
    }
    setExpandedFiles(newExpanded);
  };
  
  const handleNodeClick = (result) => {
    if (onNodeClick) {
      onNodeClick({
        fileIndex: result.fileIndex,
        messageIndex: result.messageIndex,
        messageId: result.messageId,
        messageUuid: result.messageUuid, // 添加messageUuid
        conversationUuid: result.conversationUuid || result.fileUuid
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="node-locator-panel loading">
        <div className="panel-header">
          <h3>{t('nodeLocator.searching')}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
          <div className="loading-spinner">{t('nodeLocator.searching')}...</div>
        </div>
      </div>
    );
  }
  
  if (!searchResults?.results || searchResults.results.length === 0) {
    return null;
  }
  
  return (
    <div className="node-locator-panel">
      <PanelHeader 
        stats={searchResults.stats}
        onClose={onClose}
        t={t}
      />
      
      <div className="panel-content">
          <ListView
            resultsByFile={resultsByFile}
            resultsByConversation={resultsByConversation}
            selectedFile={selectedFile}
            expandedFiles={expandedFiles}
            onFileToggle={handleFileToggle}
            onNodeClick={handleNodeClick}
            t={t}
          />
      </div>
    </div>
  );
}

/**
 * 面板头部组件
 */
function PanelHeader({ stats, viewMode, onViewModeChange, onClose, t }) {
  return (
    <div className="panel-header">
      <div className="header-main">
        <h3>{t('nodeLocator.title')}</h3>
        
      </div>
      
      <div className="header-controls">
          {t('nodeLocator.foundMessages', { 
            count: stats.total, 
            fileCount: stats.files,
            conversationCount: stats.conversations 
          })}
      </div>
    </div>
  );
}

/**
 * 列表视图组件
 */
function ListView({ 
  resultsByFile, 
  resultsByConversation,
  selectedFile,
  expandedFiles, 
  onFileToggle, 
  onNodeClick,
  t 
}) {
  return (
    <div className="list-view">
      {Object.entries(resultsByFile).map(([fileId, fileData]) => (
        <FileSection
          key={fileId}
          fileId={fileId}
          fileData={fileData}
          isExpanded={expandedFiles.has(fileId)}
          isSelected={selectedFile === fileId}
          onToggle={() => onFileToggle(fileId)}
          t={t}
        >
          {expandedFiles.has(fileId) && (
            <MessageList 
              messages={fileData.results}
              onNodeClick={onNodeClick}
              t={t}
            />
          )}
        </FileSection>
      ))}
    </div>
  );
}

/**
 * 对话段组件（更名为ConversationSection）
 */
function FileSection({ 
  fileId, 
  fileData, 
  isExpanded, 
  isSelected,
  onToggle, 
  children,
  t 
}) {
  return (
    <div className={`file-section conversation-section ${isSelected ? 'selected' : ''}`}>
      <div className="file-header conversation-header" onClick={onToggle}>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        <div className="conversation-title-group">
          <span className="conversation-name">{fileData.conversationName}</span>
          <span className="file-source">📁 {fileData.fileName}</span>
        </div>
        <span className="result-count">
          {t('nodeLocator.resultCount', { count: fileData.results.length })}
        </span>
      </div>
      
      {isExpanded && (
        <div className="file-content conversation-content">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * 对话结果组件
 */
function ConversationResults({ conversations, onNodeClick, t }) {
  const [expandedConversations, setExpandedConversations] = useState(new Set());
  
  const toggleConversation = (convId) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(convId)) {
      newExpanded.delete(convId);
    } else {
      newExpanded.add(convId);
    }
    setExpandedConversations(newExpanded);
  };
  
  return (
    <div className="conversation-results">
      {Object.entries(conversations).map(([convId, convData]) => (
        <div key={convId} className="conversation-section">
          <div 
            className="conversation-header"
            onClick={() => toggleConversation(convId)}
          >
            <span className="expand-icon">
              {expandedConversations.has(convId) ? '▼' : '▶'}
            </span>
            <span className="conversation-name">{convData.conversationName}</span>
            <span className="message-count">
              {convData.results.length} {t('nodeLocator.matches')}
            </span>
          </div>
          
          {expandedConversations.has(convId) && (
            <MessageList 
              messages={convData.results}
              onNodeClick={onNodeClick}
              t={t}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 消息列表组件
 */
function MessageList({ messages, onNodeClick, t }) {
  return (
    <div className="message-list">
      {messages.map((result, index) => (
        <MessagePreview
          key={result.messageId}
          result={result}
          index={index}
          onClick={() => onNodeClick(result)}
          t={t}
        />
      ))}
    </div>
  );
}

/**
 * 消息预览组件
 */
function MessagePreview({ result, index, onClick, t }) {
  const { message } = result;
  
  // 如果是对话搜索结果（标题搜索）
  if (result.isConversationResult) {
    return (
      <div 
        className="message-preview conversation-result"
        onClick={onClick}
      >
        <div className="message-header">
          <span className="conversation-icon">💬</span>
          <span className="conversation-title">{result.conversationName || result.fileName}</span>
        </div>
        
        <div className="message-content">
          <div className="conversation-info">
            <span className="message-count">
              {result.messageCount} {t('nodeLocator.messages')}
            </span>
            <span className="file-info">
              {t('nodeLocator.file')}: {result.fileName}
            </span>
          </div>
        </div>
        
        <div className="message-meta">
          {message.timestamp && (
            <span className="timestamp">
              {DateTimeUtils.formatDateTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // 普通消息搜索结果
  return (
    <div 
      className={`message-preview ${message.isBlank ? 'blank-message' : ''}`}
      onClick={onClick}
    >
      <div className="message-header">
        <span className="message-sender">
          {message.sender}
        </span>
        <span className="message-index">#{result.messageIndex + 1}</span>
        {message.stopReason === 'refusal' && (
          <span className="badge refusal">{t('nodeLocator.blocked')}</span>
        )}
        {message.inputMode === 'retry' && (
          <span className="badge retry">{t('nodeLocator.retry')}</span>
        )}
        {result.duplicates && result.duplicates.length > 0 && (
          <span className="badge duplicate">
            {t('nodeLocator.duplicate', { count: result.duplicates.length })}
          </span>
        )}
      </div>
      
      <div className="message-content">
        {message.isBlank ? (
          <span className="blank-indicator">{t('nodeLocator.blankMessage')}</span>
        ) : (
          <div 
            className="preview-text"
            dangerouslySetInnerHTML={{ __html: highlightQuery(result.preview, result.query) }}
          />
        )}
      </div>
      
      <div className="message-meta">
        {message.timestamp && (
          <span className="timestamp">
            {DateTimeUtils.formatDateTime(message.timestamp)}
          </span>
        )}
        {result.hasThinking && (
          <span className="has-thinking">💭 {t('nodeLocator.hasThinking')}</span>
        )}
        {result.hasArtifacts && (
          <span className="has-artifacts">🔧 {t('nodeLocator.hasArtifacts')}</span>
        )}
      </div>
    </div>
  );
}

/**
 * 高亮查询词
 */
function highlightQuery(text, query) {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
