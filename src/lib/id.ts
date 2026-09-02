// RFC 4122 v4 UUID，基于 crypto.getRandomValues 实现。
// 不使用 crypto.randomUUID：该 API 仅在 secure context（https/localhost）可用，
// 内网 http 部署时会崩溃；getRandomValues 则在所有浏览器环境均可用。
export function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
