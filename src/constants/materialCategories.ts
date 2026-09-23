import { MaterialCategoryItem, MaterialCategoryId } from '../types/material';

/**
 * Standard classification data for ScrapDeal materials.
 * NOTE: Contains ONLY classification metadata (no fake market prices).
 */
export const MATERIAL_CATEGORIES: MaterialCategoryItem[] = [
  {
    id: 'pcb',
    iconName: 'chip',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryPcb',
    subtitleKey: 'categoryPcbSub',
    color: '#00875A',
    bgColor: '#E3FCEF',
  },
  {
    id: 'copper',
    iconName: 'cube-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryCopper',
    subtitleKey: 'categoryCopperSub',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'aluminium',
    iconName: 'layers-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryAluminium',
    subtitleKey: 'categoryAluminiumSub',
    color: '#4B5563',
    bgColor: '#F3F4F6',
  },
  {
    id: 'iron_steel',
    iconName: 'hardware-chip-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryIronSteel',
    subtitleKey: 'categoryIronSteelSub',
    color: '#374151',
    bgColor: '#E5E7EB',
  },
  {
    id: 'e_waste',
    iconName: 'laptop-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryEWaste',
    subtitleKey: 'categoryEWasteSub',
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  {
    id: 'cables',
    iconName: 'cable-data',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryWires',
    subtitleKey: 'categoryWiresSub',
    color: '#0D9488',
    bgColor: '#CCFBF1',
  },
  {
    id: 'battery',
    iconName: 'battery-charging',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryBattery',
    subtitleKey: 'categoryBatterySub',
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'plastic',
    iconName: 'recycle',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryPlastic',
    subtitleKey: 'categoryPlasticSub',
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'motor',
    iconName: 'engine-outline',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryMotor',
    subtitleKey: 'categoryMotorSub',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  {
    id: 'tv_crt',
    iconName: 'tv-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryTvCrt',
    subtitleKey: 'categoryTvCrtSub',
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
  {
    id: 'other',
    iconName: 'ellipsis-horizontal-circle-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryOther',
    subtitleKey: 'categoryOtherSub',
    color: '#64748B',
    bgColor: '#F1F5F9',
  },
];

export function getCategoryById(id: string): MaterialCategoryItem | undefined {
  return MATERIAL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryDisplayName(id: string): string {
  const cat = getCategoryById(id);
  if (!cat) return id.toUpperCase();
  // Formatting helper fallback
  return cat.id.replace('_', ' ').toUpperCase();
}
