// Re-export existing parsers from utils/fileParser (plain JS, no React deps)
// These are kept as-is to preserve all supported formats.
export {
  extractChatData,
  detectBranches,
  detectFileFormat,
  parseJSONL,
  extractMergedJSONLData,
  mergeJSONLFiles,
  getImageDisplayData,
  formatFileSize,
  DateTimeUtils,
  PlatformUtils,
  FileUtils,
  TextUtils,
} from '../utils/fileParser/index.js'
