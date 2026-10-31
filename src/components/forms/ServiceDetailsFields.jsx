import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_CATEGORIES } from "@/lib/serviceCovers";
import ServiceTimeSelect from "@/components/forms/ServiceTimeSelect";
import { useLanguage } from '@/i18n/LanguageContext';

// Shared service listing fields — used by the create form and the service edit page.
// Controlled through the same formData / setFormData shape the create form uses.
export default function ServiceDetailsFields({ formData, setFormData }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">{t('service.title')} <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder={t('service.title_ph')}
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="category">{t('create.category')} <span className="text-red-500">*</span></Label>
          <Select value={formData.category} onValueChange={(value) => setFormData((p) => ({ ...p, category: value }))}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{t(`category.${category}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="required_hours">{t('service.time')} <span className="text-red-500">*</span></Label>
          <ServiceTimeSelect
            id="required_hours"
            value={formData.required_hours}
            onChange={(value) => setFormData((p) => ({ ...p, required_hours: value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">{t('create.description')} <span className="text-red-500">*</span></Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          placeholder={t('service.description_ph')}
          rows={4}
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="suggested_tasks">{t('service.details')}</Label>
        <Textarea
          id="suggested_tasks"
          value={formData.suggested_tasks}
          onChange={(e) => setFormData((p) => ({ ...p, suggested_tasks: e.target.value }))}
          placeholder={t('service.details_ph')}
          rows={3}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="offerer_terms">{t('create.terms')}</Label>
        <Textarea
          id="offerer_terms"
          value={formData.offerer_terms}
          onChange={(e) => setFormData((p) => ({ ...p, offerer_terms: e.target.value }))}
          placeholder={t('service.terms_ph')}
          rows={3}
          className="mt-2"
        />
      </div>
    </>
  );
}