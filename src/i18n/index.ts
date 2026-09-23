import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { LanguageCode } from '../types';

export const translations: Record<LanguageCode, typeof en> = {
  en,
  hi,
  mr,
};

export type TranslationKey = keyof typeof en;

export { en, hi, mr };
