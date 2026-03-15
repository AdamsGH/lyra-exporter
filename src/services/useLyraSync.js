/**
 * useLyraSync - bridge between localStorage (existing app logic) and lyra-api.
 *
 * Strategy:
 * - On mount: load all meta from backend, merge into localStorage so existing
 *   app code works without changes.
 * - On meta change: debounced push to backend.
 * - Files: provide helpers to upload/list/delete from S3; downloaded files are
 *   passed directly to the existing file loading logic.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { metaApi, settingsApi, filesApi, isBackendAvailable } from './lyraApi';
import StorageManager from '../utils/storageManager';

const DEBOUNCE_MS = 800;

export function useLyraSync() {
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [s3Files, setS3Files] = useState([]);
  const [s3Loading, setS3Loading] = useState(false);
  const debounceTimers = useRef({});

  // Check backend availability once on mount
  useEffect(() => {
    isBackendAvailable().then(setBackendAvailable);
  }, []);

  // Pull all meta from backend and merge into localStorage
  useEffect(() => {
    if (!backendAvailable) return;
    metaApi.getAll().then((items) => {
      items.forEach(({ conversation_id, tags, starred, notes }) => {
        // Merge: backend wins for tags/starred; notes stored separately
        if (tags.length > 0) {
          StorageManager.set(`marks_${conversation_id}`, tags);
        }
        if (starred) {
          const current = StorageManager.get('starred_conversations', []);
          if (!current.includes(conversation_id)) {
            StorageManager.set('starred_conversations', [...current, conversation_id]);
          }
        }
      });
    }).catch(console.error);
  }, [backendAvailable]);

  // Push meta update to backend with debounce
  const syncMeta = useCallback((conversationId, meta) => {
    if (!backendAvailable) return;
    const key = `meta_${conversationId}`;
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(() => {
      metaApi.update(conversationId, meta).catch(console.error);
      delete debounceTimers.current[key];
    }, DEBOUNCE_MS);
  }, [backendAvailable]);

  // Convenience: sync tags change
  const syncTags = useCallback((conversationId, tags) => {
    const starred = (StorageManager.get('starred_conversations', []) || []).includes(conversationId);
    syncMeta(conversationId, { tags, starred, notes: '' });
  }, [syncMeta]);

  // Convenience: sync starred change
  const syncStarred = useCallback((conversationId, starred) => {
    const tags = StorageManager.get(`marks_${conversationId}`, []) || [];
    syncMeta(conversationId, { tags, starred, notes: '' });
  }, [syncMeta]);

  // S3 file listing
  const refreshS3Files = useCallback(async () => {
    if (!backendAvailable) return;
    setS3Loading(true);
    try {
      const files = await filesApi.list();
      setS3Files(files);
    } catch (e) {
      console.error('Failed to list S3 files:', e);
    } finally {
      setS3Loading(false);
    }
  }, [backendAvailable]);

  useEffect(() => {
    if (backendAvailable) refreshS3Files();
  }, [backendAvailable, refreshS3Files]);

  // Upload file to S3
  const uploadToS3 = useCallback(async (file) => {
    if (!backendAvailable) throw new Error('Backend not available');
    await filesApi.upload(file);
    await refreshS3Files();
  }, [backendAvailable, refreshS3Files]);

  // Download file from S3 and return as File object for existing load logic
  const downloadFromS3 = useCallback(async (filename) => {
    const data = await filesApi.download(filename);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    return new File([blob], filename, { type: 'application/json' });
  }, []);

  // Delete file from S3
  const deleteFromS3 = useCallback(async (filename) => {
    await filesApi.delete(filename);
    await refreshS3Files();
  }, [refreshS3Files]);

  // Settings sync
  const saveSettings = useCallback(async (settings) => {
    if (!backendAvailable) return;
    await settingsApi.save(settings).catch(console.error);
  }, [backendAvailable]);

  const loadSettings = useCallback(async () => {
    if (!backendAvailable) return null;
    const { settings } = await settingsApi.get().catch(() => ({ settings: null }));
    return settings;
  }, [backendAvailable]);

  return {
    backendAvailable,
    s3Files,
    s3Loading,
    syncTags,
    syncStarred,
    uploadToS3,
    downloadFromS3,
    deleteFromS3,
    refreshS3Files,
    saveSettings,
    loadSettings,
  };
}
