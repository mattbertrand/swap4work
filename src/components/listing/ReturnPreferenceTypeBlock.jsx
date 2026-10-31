import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ITEM_CATEGORIES, SERVICE_CATEGORIES } from '@/lib/exchangePrefs';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ReturnPreferenceTypeBlock({ noun, anyFlag, categories, custom, onChange }) {
  const { t } = useLanguage();
  const options = noun === 'item' ? ITEM_CATEGORIES : SERVICE_CATEGORIES;
  return <div className="border border-gray-200 rounded-xl p-4 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <Label className="text-sm font-semibold">{t(`return.kind_${noun}`)}</Label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox checked={anyFlag} onCheckedChange={checked => onChange({ any: !!checked })} />
        {t(noun === 'item' ? 'prefs.open_any_item' : 'prefs.open_any_service')}
      </label>
    </div>
    {!anyFlag && <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {options.map(category => <label key={category} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer ${categories.includes(category) ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600'}`}>
          <Checkbox checked={categories.includes(category)} onCheckedChange={checked => onChange({ categories: checked ? [...categories, category] : categories.filter(c => c !== category) })} />
          {t(`category.${category}`)}
        </label>)}
      </div>
      <Input maxLength={500} value={custom} onChange={e => onChange({ custom: e.target.value })} aria-label={t(`return.custom_${noun}`)} placeholder={t(`return.custom_${noun}`)} className="text-sm" />
      <p className="text-xs text-gray-500 mt-1.5">{t('return.guidance')}</p>
    </>}
  </div>;
}