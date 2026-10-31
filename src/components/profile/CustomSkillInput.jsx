import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { appendCustomSkill, MAX_TOTAL_SKILLS } from "@/lib/skills";
import { toast } from "sonner";
import { useLanguage } from '@/i18n/LanguageContext';

// Free-text "Other" skill entry, shared by Complete Profile and Profile.
// Sanitizes, caps length, and dedupes before handing the updated list back.
export default function CustomSkillInput({ currentSkills, onAdd }) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error(t('skill.empty'));
      return;
    }
    const { skills, error } = appendCustomSkill(currentSkills, trimmed);
    if (error === "empty") {
      toast.error(t('skill.invalid'));
      return;
    }
    if (error === "duplicate") {
      toast.error(t('skill.duplicate'));
      return;
    }
    if (error === "limit") {
      toast.error(t('skill.limit', { count: MAX_TOTAL_SKILLS }));
      return;
    }
    onAdd(skills);
    setValue("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <Label>{t('skill.custom')}</Label>
      <p className="text-xs text-gray-500 mb-2">
        {t('skill.custom_help')}
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          maxLength={40}
          placeholder={t('skill.custom_ph')}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="h-9"
        />
        <Button
          type="button"
          onClick={handleAdd}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('common.add')}
        </Button>
      </div>
    </div>
  );
}