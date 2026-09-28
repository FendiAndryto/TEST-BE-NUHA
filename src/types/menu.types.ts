export interface MenuItemNode {
  id: number;
  name: string;
  code: string;
  icon: string | null;
  path: string | null;
  orderIndex: number;
  parentId: number | null;
  isActive: boolean;
  children: MenuItemNode[];
}
