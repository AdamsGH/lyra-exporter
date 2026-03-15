import React, { useRef, useState } from 'react';

/**
 * S3FileManager - panel for managing conversation files stored in Garage S3.
 * Shows file list, allows upload, download (load into app), and delete.
 */
export default function S3FileManager({ isOpen, onClose, lyraSync, onLoadFiles }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const { s3Files, s3Loading, uploadToS3, downloadFromS3, deleteFromS3, backendAvailable } = lyraSync;

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      for (const file of files) {
        await uploadToS3(file);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleLoad(filename) {
    setError('');
    try {
      const file = await downloadFromS3(filename);
      onLoadFiles([file]);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(filename) {
    if (!window.confirm(`Delete ${filename} from cloud storage?`)) return;
    setError('');
    try {
      await deleteFromS3(filename);
    } catch (err) {
      setError(err.message);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="s3-manager-overlay" onClick={onClose}>
      <div className="s3-manager-panel" onClick={e => e.stopPropagation()}>
        <div className="s3-manager-header">
          <h3>☁️ Cloud Files</h3>
          <button className="s3-manager-close" onClick={onClose}>✕</button>
        </div>

        {!backendAvailable && (
          <div className="s3-manager-notice">Backend not available - running in local mode</div>
        )}

        {error && <div className="s3-manager-error">⚠️ {error}</div>}

        <div className="s3-manager-toolbar">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            className="s3-manager-btn s3-manager-btn--primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !backendAvailable}
          >
            {uploading ? 'Uploading...' : '↑ Upload JSON'}
          </button>
          <button
            className="s3-manager-btn"
            onClick={lyraSync.refreshS3Files}
            disabled={s3Loading}
          >
            {s3Loading ? '...' : '↻ Refresh'}
          </button>
        </div>

        <div className="s3-manager-list">
          {s3Files.length === 0 && !s3Loading && (
            <div className="s3-manager-empty">No files uploaded yet</div>
          )}
          {s3Files.map(file => (
            <div key={file.key} className="s3-manager-item">
              <div className="s3-manager-item-info">
                <span className="s3-manager-item-name">{file.name}</span>
                <span className="s3-manager-item-meta">
                  {formatSize(file.size)} · {new Date(file.last_modified).toLocaleDateString()}
                </span>
              </div>
              <div className="s3-manager-item-actions">
                <button
                  className="s3-manager-btn s3-manager-btn--small"
                  onClick={() => handleLoad(file.name)}
                  title="Load into app"
                >
                  ↓ Load
                </button>
                <button
                  className="s3-manager-btn s3-manager-btn--small s3-manager-btn--danger"
                  onClick={() => handleDelete(file.name)}
                  title="Delete from cloud"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
