export type MaterialCategoryId =
  | 'e_waste'
  | 'copper'
  | 'aluminium'
  | 'iron_steel'
  | 'pcb'
  | 'cables'
  | 'wires'
  | 'battery'
  | 'plastic'
  | 'mixed_plastic'
  | 'tv_crt'
  | 'lcd_panel'
  | 'motor'
  | 'magnet'
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
