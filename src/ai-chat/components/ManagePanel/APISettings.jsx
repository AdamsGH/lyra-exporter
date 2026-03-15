/**
 * Lyra AI Chat - API Settings Component
 * API设置组件
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Button, Input, Badge, IconCheck } from '../Common/index.jsx'
import { useSettingsStore } from '../../hooks/index.js'
import { chatService } from '../../services/ChatService.js'

/**
 * 模型选项
 */
const PROTOCOL_OPTIONS = [
  { id: 'anthropic', name: 'Anthropic (Claude)' },
  { id: 'openai', name: 'OpenAI (Compatible)' }
]

const ANTHROPIC_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '平衡性能与速度' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '快速响应' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '最强性能' }
]

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: '最新旗舰模型' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', description: '高效轻量模型' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '高性价比选择' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: '强化推理模型' }
]

/**
 * API设置组件
 */
export function APISettings() {
  const { apiConfig, setAPIConfig } = useSettingsStore()

  const [protocol, setProtocol] = useState(apiConfig?.protocol || 'anthropic')
  const [apiKey, setApiKey] = useState(apiConfig?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(apiConfig?.baseUrl || 'https://api.anthropic.com')
  const [model, setModel] = useState(apiConfig?.model || 'claude-3-5-sonnet-20241022')
  const [maxTokens, setMaxTokens] = useState(apiConfig?.maxTokens || 4096)

  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState('')

  // 协议切换时更新默认值
  const handleProtocolChange = (newProtocol) => {
    setProtocol(newProtocol)
    if (newProtocol === 'openai') {
      setBaseUrl('https://api.openai.com/v1')
      setModel('gpt-4o')
    } else {
      setBaseUrl('https://api.anthropic.com')
      setModel('claude-3-5-sonnet-20241022')
    }
  }

  // 同步配置
  useEffect(() => {
    if (apiConfig) {
      setProtocol(apiConfig.protocol || 'anthropic')
      setApiKey(apiConfig.apiKey || '')
      setBaseUrl(apiConfig.baseUrl || (apiConfig.protocol === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com'))
      setModel(apiConfig.model || (apiConfig.protocol === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'))
      setMaxTokens(apiConfig.maxTokens || 4096)
    }
  }, [apiConfig])

  const handleSave = useCallback(() => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    const config = {
      protocol,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || (protocol === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com'),
      model,
      maxTokens: parseInt(maxTokens, 10) || 4096
    }

    // 保存到store
    setAPIConfig(config)

    // 配置chatService
    chatService.configure(config)

    setError('')
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }, [protocol, apiKey, baseUrl, model, maxTokens, setAPIConfig])

  const isConfigured = chatService.isConfigured()
  const currentModels = protocol === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS

  return (
    <div className="lyra-api-settings">
      <div className="lyra-api-settings__header">
        <h4>API 配置</h4>
        {isConfigured && (
          <Badge variant="success">
            <IconCheck size={12} /> 已配置
          </Badge>
        )}
      </div>

      <div className="lyra-form-group">
        <label>通信协议</label>
        <select
          className="lyra-select"
          value={protocol}
          onChange={(e) => handleProtocolChange(e.target.value)}
        >
          {PROTOCOL_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>

      <div className="lyra-form-group">
        <label>API Key *</label>
        <Input
          type="password"
          value={apiKey}
          onChange={setApiKey}
          placeholder={protocol === 'openai' ? 'sk-...' : 'sk-ant-...'}
        />
        <span className="lyra-form-hint">
          {protocol === 'openai' ? 'API key for OpenAI or compatible service' : 'Obtain your API key from Anthropic Console'}
        </span>
      </div>

      <div className="lyra-form-group">
        <label>API Base URL</label>
        <Input
          value={baseUrl}
          onChange={setBaseUrl}
          placeholder={protocol === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com'}
        />
        <span className="lyra-form-hint">
          Defaults to the official endpoint. Supports any OpenAI-compatible proxy.
        </span>
      </div>

      <div className="lyra-form-group">
        <label>Model</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input
            value={model}
            onChange={setModel}
            placeholder={protocol === 'openai' ? 'e.g. gpt-4o' : 'e.g. claude-3-5-sonnet-20241022'}
            style={{ flex: 1 }}
          />
          <select
            className="lyra-select"
            style={{ width: 'auto', maxWidth: '140px' }}
            onChange={(e) => e.target.value && setModel(e.target.value)}
            value=""
          >
            <option value="" disabled>Select...</option>
            {currentModels.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
        <span className="lyra-form-hint">
          Type a model name or pick one from the list
        </span>
      </div>

      <div className="lyra-form-group">
        <label>Max Tokens</label>
        <Input
          type="number"
          value={maxTokens}
          onChange={(v) => setMaxTokens(parseInt(v, 10) || 4096)}
          min={1}
          max={200000}
        />
      </div>

      {error && (
        <div className="lyra-api-settings__error">
          ⚠️ {error}
        </div>
      )}

      <div className="lyra-form-actions">
        <Button
          variant="primary"
          onClick={handleSave}
        >
          {isSaved ? '✓ Saved' : 'Save configuration'}
        </Button>
      </div>

      <div className="lyra-api-settings__note">
        <h5>Notes</h5>
        <ul>
          <li>Your API key is stored locally only and never sent to any external server</li>
          <li>Make sure your account has sufficient API credits</li>
          <li>A proxy is recommended for a more stable connection</li>
        </ul>
      </div>
    </div>
  )
}

export default APISettings
