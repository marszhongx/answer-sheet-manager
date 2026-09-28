// 下载文件名统一过滤各平台不允许出现的字符（路径分隔符与 Windows 保留字符），
// 避免名称里的 / : ? 等导致下载行为在浏览器间不一致。
export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}
