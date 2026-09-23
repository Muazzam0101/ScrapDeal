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
    labelEn: 'PCB (Circuit Board)',
    color: '#00875A',
    bgColor: '#E3FCEF',
  },
  {
    id: 'copper',
    iconName: 'cube-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryCopper',
    subtitleKey: 'categoryCopperSub',
    labelEn: 'Copper',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'aluminium',
    iconName: 'layers-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryAluminium',
    subtitleKey: 'categoryAluminiumSub',
    labelEn: 'Aluminium',
    color: '#4B5563',
    bgColor: '#F3F4F6',
  },
  {
    id: 'iron_steel',
    iconName: 'hardware-chip-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryIronSteel',
    subtitleKey: 'categoryIronSteelSub',
    labelEn: 'Iron / Steel',
    color: '#374151',
    bgColor: '#E5E7EB',
  },
  {
    id: 'e_waste',
    iconName: 'laptop-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryEWaste',
    subtitleKey: 'categoryEWasteSub',
    labelEn: 'E-Waste',
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  {
    id: 'cables',
    iconName: 'cable-data',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryWires',
    subtitleKey: 'categoryWiresSub',
    labelEn: 'Wires & Cables',
    color: '#0D9488',
    bgColor: '#CCFBF1',
  },
  {
    id: 'battery',
    iconName: 'battery-charging',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryBattery',
    subtitleKey: 'categoryBatterySub',
    labelEn: 'Batteries',
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  {
    id: 'plastic',
    iconName: 'recycle',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryPlastic',
    subtitleKey: 'categoryPlasticSub',
    labelEn: 'Plastics',
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'motor',
    iconName: 'engine-outline',
    iconFamily: 'MaterialCommunityIcons',
    titleKey: 'categoryMotor',
    subtitleKey: 'categoryMotorSub',
    labelEn: 'Motors & Magnets',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  {
    id: 'tv_crt',
    iconName: 'tv-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryTvCrt',
    subtitleKey: 'categoryTvCrtSub',
    labelEn: 'TV / CRT',
    color: '#EA580C',
    bgColor: '#FFEDD5',
  },
  {
    id: 'other',
    iconName: 'ellipsis-horizontal-circle-outline',
    iconFamily: 'Ionicons',
    titleKey: 'categoryOther',
    subtitleKey: 'categoryOtherSub',
    labelEn: 'Other Scrap',
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
  return cat.labelEn || cat.id.replace('_', ' ').toUpperCase();
}
