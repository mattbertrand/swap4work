import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_CATEGORIES } from "@/lib/serviceCovers";
import ServiceTimeSelect from "@/components/forms/ServiceTimeSelect";

// Shared service listing fields — used by the create form and the service edit page.
// Controlled through the same formData / setFormData shape the create form uses.
export default function ServiceDetailsFields({ formData, setFormData }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Service Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g., Professional House Cleaning"
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
          <Select value={formData.category} onValueChange={(value) => setFormData((p) => ({ ...p, category: value }))}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="required_hours">Service Time Offered <span className="text-red-500">*</span></Label>
          <ServiceTimeSelect
            id="required_hours"
            value={formData.required_hours}
            onChange={(value) => setFormData((p) => ({ ...p, required_hours: value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          placeholder="Describe the service you're offering, your experience, and what's included..."
          rows={4}
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="suggested_tasks">Service Details</Label>
        <Textarea
          id="suggested_tasks"
          value={formData.suggested_tasks}
          onChange={(e) => setFormData((p) => ({ ...p, suggested_tasks: e.target.value }))}
          placeholder="e.g., Includes materials, takes 2-3 hours, flexible schedule..."
          rows={3}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="offerer_terms">Your Terms (non-negotiable)</Label>
        <Textarea
          id="offerer_terms"
          value={formData.offerer_terms}
          onChange={(e) => setFormData((p) => ({ ...p, offerer_terms: e.target.value }))}
          placeholder="e.g., Work must be completed within 2 weeks, materials provided by client..."
          rows={3}
          className="mt-2"
        />
      </div>
    </>
  );
}