import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThemeStore } from '@/store/themeStore';
import './purchase-select.css';

interface PurchaseSelectProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}

// Radix reserves an empty value for placeholders. Keep empty filters unchanged
// in page state while giving their selectable "Any / All" option a stable value.
const EMPTY_OPTION = '__purchase_select_empty__';

export default function PurchaseSelect({ id, value, onValueChange, options, placeholder, emptyLabel, disabled }: PurchaseSelectProps) {
  const dark = useThemeStore(state => state.dark);
  return <Select value={value || (emptyLabel ? EMPTY_OPTION : '')} onValueChange={next => onValueChange(next === EMPTY_OPTION ? '' : next)} disabled={disabled}>
    <SelectTrigger id={id} className="purchase-select-trigger"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent className={`purchase-select-content ${dark ? 'purchase-select-dark' : ''}`}>
      {emptyLabel && <SelectItem value={EMPTY_OPTION}>{emptyLabel}</SelectItem>}
      {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
