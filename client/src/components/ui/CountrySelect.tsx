import SearchableSelect from "./SearchableSelect";
import { COUNTRIES } from "@/data/countries";

const OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
  flagUrl: `https://flagcdn.com/w20/${c.code.toLowerCase()}.png`,
}));

interface CountrySelectProps {
  value: string;
  onSelect: (code: string, name: string) => void;
  disabled?: boolean;
}

export default function CountrySelect({ value, onSelect, disabled }: CountrySelectProps) {
  const handleChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    if (country) onSelect(country.code, country.name);
  };

  return (
    <SearchableSelect
      options={OPTIONS}
      value={value}
      onChange={handleChange}
      placeholder="Select country"
      disabled={disabled}
    />
  );
}
