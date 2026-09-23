export type MaterialCategoryId =
  | 'pcb'
  | 'wires'
  | 'battery'
  | 'tv_crt'
  | 'lcd_panel'
  | 'motor'
  | 'magnet'
  | 'mixed_plastic'
  | 'other';

export interface MaterialCategoryItem {
  id: MaterialCategoryId;
  iconName: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather';
  titleKey: string;
  subtitleKey?: string;
  color: string;
  bgColor: string;
}

export type MaterialCondition = 'used' | 'mixed' | 'damaged' | 'sorted';

export interface PriceRecord {
  id: string;
  categoryId: MaterialCategoryId;
  materialName: string;
  minRate: number;
  maxRate: number;
  currentRate: number;
  unit: 'kg' | 'piece';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  locationCity: string;
}
