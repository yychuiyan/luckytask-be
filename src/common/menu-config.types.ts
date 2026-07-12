/** 单个菜单项权限 */
export interface MenuPerm {
  read: boolean;
  write: boolean;
  label: string;
  children?: Record<string, MenuPerm>;
}

/** 完整菜单配置 */
export type MenuConfig = Record<string, MenuPerm>;
