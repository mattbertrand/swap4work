import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { appendCustomSkill, MAX_TOTAL_SKILLS } from "@/lib/skills";
import { toast } from "sonner";

// Free-text "Other" skill entry, shared by Complete Profile and Profile.
// Sanitizes, caps length, and dedupes before handing the updated list back.
export default function CustomSkillInput({ currentSkills, onAdd }) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Type a skill to add.");
      return;
    }
    const { skills, error } = appendCustomSkill(currentSkills, trimmed);
    if (error === "empty") {
      toast.error("That entry didn't contain any valid characters.");
      return;
    }
    if (error === "duplicate") {
      toast.error("That skill is already selected.");
      return;
    }
    if (error === "limit") {
      toast.error(`You can select up to ${MAX_TOTAL_SKILLS} skills total.`);
      return;
    }
    onAdd(skills);
    setValue("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <Label>Other — add your own skill</Label>
      <p className="text-xs text-gray-500 mb-2">
        Up to 40 characters. Letters, numbers, spaces and simple punctuation ( &amp; ( ) - , ' / ) are allowed.
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          maxLength={40}
          placeholder="e.g. Drone repair, Bike tuning..."
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
          Add
        </Button>
      </div>
    </div>
  );
}