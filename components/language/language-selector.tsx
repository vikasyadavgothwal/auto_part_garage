"use client";

import { Globe2 } from "lucide-react";

import { useLanguage } from "@/components/language/language-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dashboardLanguages = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
] as const;

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="notranslate" data-no-translate="true" translate="no">
      <Select value={language} onValueChange={(value) => setLanguage(value === "ar" ? "ar" : "en")}>
        <SelectTrigger
          className="notranslate h-10 w-[8.5rem] rounded-sm border-border bg-brand-panel-strong text-foreground"
          aria-label="Select language"
          translate="no"
        >
          <Globe2 className="size-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="notranslate" data-no-translate="true" translate="no">
          {dashboardLanguages.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              className="notranslate"
              data-no-translate="true"
              translate="no"
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
