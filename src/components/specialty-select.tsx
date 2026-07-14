import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { specialties } from "@/lib/mock-data";

const OTHER = "__other__";

/* Specialty picker with an "Other" escape hatch: the fixed list stays the fast
   path, but picking "Other" (or arriving with a saved value that isn't in the
   list) swaps in a free-text input. The emitted value is always the plain
   specialty string, so nothing downstream has to know about the OTHER token. */
export function SpecialtySelect({
  value,
  onChange,
  placeholder = "Select your specialty",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [otherPicked, setOtherPicked] = useState(false);
  const isCustom = otherPicked || (value !== "" && !specialties.includes(value));

  return (
    <div className="space-y-2">
      <Select
        value={isCustom ? OTHER : value}
        onValueChange={(v) => {
          if (v === OTHER) {
            setOtherPicked(true);
            onChange("");
          } else {
            setOtherPicked(false);
            onChange(v);
          }
        }}
        required={required && !isCustom}
      >
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          <SelectItem value={OTHER}>Other (type your own)</SelectItem>
        </SelectContent>
      </Select>
      {isCustom && (
        <Input
          value={value}
          onChange={(e) => {
            setOtherPicked(true);
            onChange(e.target.value);
          }}
          placeholder="e.g. Ophthalmologist"
          required={required}
          autoFocus
        />
      )}
    </div>
  );
}
