/**
 * 访客ID管理工具
 * 生成和管理访客唯一标识符，用于AI对话记录系统
 */

const STORAGE_KEY = 'ai_guest_id';
const CREATED_KEY = 'ai_guest_created';

/**
 * 获取或创建访客ID
 * @returns 访客ID，格式：guest_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(STORAGE_KEY);
  
  if (!guestId) {
    // 生成格式：guest_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    guestId = 'guest_' + crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, guestId);
    
    // 记录首次访问时间
    localStorage.setItem(CREATED_KEY, Date.now().toString());
  }
  
  return guestId;
}

/**
 * 获取访客创建时间
 * @returns 创建时间戳，如果不存在返回null
 */
export function getGuestCreatedTime(): number | null {
  const created = localStorage.getItem(CREATED_KEY);
  return created ? parseInt(created, 10) : null;
}

/**
 * 清除访客ID（重置）
 */
export function clearGuestId(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CREATED_KEY);
}

/**
 * 检查是否已有访客ID
 * @returns 是否存在访客ID
 */
export function hasGuestId(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

/**
 * 获取当前访客ID（不创建新的）
 * @returns 当前访客ID或null
 */
export function getCurrentGuestId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}