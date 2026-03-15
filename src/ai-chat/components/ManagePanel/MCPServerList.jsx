/**
 * Lyra AI Chat - MCP Server List Component
 * MCP服务器列表组件
 */

import React, { useState, useCallback } from 'react'
import {
  Button,
  IconButton,
  Switch,
  Badge,
  Input,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconCheck,
  IconLoading,
  Divider
} from '../Common/index.jsx'
import { useMCPService } from '../../hooks/index'

/**
 * 服务器项组件
 */
function ServerItem({ server, onToggle, onRemove }) {
  const isBuiltin = server.type === 'builtin'

  return (
    <div className={`lyra-server-item ${server.isActive ? 'lyra-server-item--active' : ''}`}>
      <div className="lyra-server-item__info">
        <div className="lyra-server-item__header">
          <span className="lyra-server-item__name">{server.name}</span>
          {isBuiltin && <Badge variant="info">内置</Badge>}
        </div>
        <div className="lyra-server-item__meta">
          {server.command && (
            <span className="lyra-server-item__command">
              {server.command} {server.args?.join(' ')}
            </span>
          )}
          {server.baseUrl && (
            <span className="lyra-server-item__url">{server.baseUrl}</span>
          )}
        </div>
      </div>
      <div className="lyra-server-item__actions">
        <Switch
          checked={server.isActive}
          onChange={(checked) => onToggle(server.id, checked)}
        />
        {!isBuiltin && (
          <IconButton
            icon={<IconTrash size={14} />}
            onClick={() => onRemove(server.id)}
            title="删除服务器"
            size="sm"
          />
        )}
      </div>
    </div>
  )
}

/**
 * 添加服务器表单
 */
function AddServerForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('stdio') // stdio | http
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    if (!name.trim()) return

    const config = {
      name: name.trim(),
      ...(type === 'stdio' ? {
        command: command.trim(),
        args: args.trim().split(/\s+/).filter(Boolean)
      } : {
        baseUrl: baseUrl.trim()
      })
    }

    onAdd(config)
  }, [name, type, command, args, baseUrl, onAdd])

  return (
    <form className="lyra-add-server-form" onSubmit={handleSubmit}>
      <div className="lyra-form-group">
        <label>服务器名称</label>
        <Input
          value={name}
          onChange={setName}
          placeholder="例如: My MCP Server"
        />
      </div>

      <div className="lyra-form-group">
        <label>连接类型</label>
        <div className="lyra-radio-group">
          <label>
            <input
              type="radio"
              name="type"
              value="stdio"
              checked={type === 'stdio'}
              onChange={() => setType('stdio')}
            />
            Stdio (命令行)
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="http"
              checked={type === 'http'}
              onChange={() => setType('http')}
            />
            HTTP/SSE
          </label>
        </div>
      </div>

      {type === 'stdio' ? (
        <>
          <div className="lyra-form-group">
            <label>命令</label>
            <Input
              value={command}
              onChange={setCommand}
              placeholder="例如: npx"
            />
          </div>
          <div className="lyra-form-group">
            <label>参数</label>
            <Input
              value={args}
              onChange={setArgs}
              placeholder="例如: -y @modelcontextprotocol/server-filesystem"
            />
          </div>
        </>
      ) : (
        <div className="lyra-form-group">
          <label>服务器URL</label>
          <Input
            value={baseUrl}
            onChange={setBaseUrl}
            placeholder="例如: http://localhost:3000/mcp"
          />
        </div>
      )}

      <div className="lyra-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" variant="primary" disabled={!name.trim()}>
          添加
        </Button>
      </div>
    </form>
  )
}

/**
 * MCP服务器列表组件
 */
export function MCPServerList() {
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    servers,
    tools,
    isLoading,
    addServer,
    removeServer,
    toggleServer,
    refreshServers,
    refreshTools
  } = useMCPService()

  const handleAddServer = useCallback(async (config) => {
    await addServer(config)
    setShowAddForm(false)
  }, [addServer])

  const handleRefresh = useCallback(async () => {
    refreshServers()
    await refreshTools()
  }, [refreshServers, refreshTools])

  const builtinServers = servers.filter(s => s.type === 'builtin')
  const customServers = servers.filter(s => s.type === 'custom')
  const activeTools = tools.length

  return (
    <div className="lyra-mcp-server-list">
      {/* 状态栏 */}
      <div className="lyra-mcp-server-list__header">
        <div className="lyra-mcp-server-list__stats">
          <Badge variant="info">{servers.length} 服务器</Badge>
          <Badge variant="success">{activeTools} 工具可用</Badge>
        </div>
        <div className="lyra-mcp-server-list__actions">
          <IconButton
            icon={isLoading ? <IconLoading size={16} /> : <IconRefresh size={16} />}
            onClick={handleRefresh}
            disabled={isLoading}
            title="刷新"
            size="sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <IconPlus size={14} /> 添加
          </Button>
        </div>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <>
          <AddServerForm
            onAdd={handleAddServer}
            onCancel={() => setShowAddForm(false)}
          />
          <Divider />
        </>
      )}

      {/* 内置服务器 */}
      {builtinServers.length > 0 && (
        <div className="lyra-mcp-server-list__section">
          <h4 className="lyra-mcp-server-list__title">内置MCP</h4>
          <div className="lyra-mcp-server-list__items">
            {builtinServers.map(server => (
              <ServerItem
                key={server.id}
                server={server}
                onToggle={toggleServer}
                onRemove={removeServer}
              />
            ))}
          </div>
        </div>
      )}

      {/* 自定义服务器 */}
      <div className="lyra-mcp-server-list__section">
        <h4 className="lyra-mcp-server-list__title">自定义MCP</h4>
        <div className="lyra-mcp-server-list__items">
          {customServers.length > 0 ? (
            customServers.map(server => (
              <ServerItem
                key={server.id}
                server={server}
                onToggle={toggleServer}
                onRemove={removeServer}
              />
            ))
          ) : (
            <div className="lyra-mcp-server-list__empty">
              暂无自定义MCP服务器
            </div>
          )}
        </div>
      </div>

      {/* 工具列表预览 */}
      {tools.length > 0 && (
        <div className="lyra-mcp-server-list__section">
          <h4 className="lyra-mcp-server-list__title">可用工具</h4>
          <div className="lyra-mcp-tool-list">
            {tools.map(tool => (
              <div key={tool.id} className="lyra-mcp-tool-item">
                <span className="lyra-mcp-tool-item__name">🔧 {tool.name}</span>
                <span className="lyra-mcp-tool-item__server">{tool.serverName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MCPServerList
