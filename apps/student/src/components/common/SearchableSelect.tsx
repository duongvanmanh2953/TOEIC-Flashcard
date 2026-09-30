import React from 'react';
import { CustomDropdown, CustomDropdownProps, DropdownOption } from './CustomDropdown';

export type { DropdownOption };

export interface SearchableSelectProps extends Omit<CustomDropdownProps, 'searchable'> {
  searchable?: boolean;
}

/**
 * Standardized SearchableSelect Component
 * Built on top of CustomDropdown foundation with built-in:
 * - Viewport collision detection (flip-up & shift-left/right)
 * - Safe responsive width (max-width: min(50vw, 520px) desktop, 80vw mobile)
 * - Text-wrapping for long labels (no truncation)
 * - Sticky search with accent-insensitive matching
 * - Creatable option support for dynamic categories/tags
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = (props) => {
  return <CustomDropdown {...props} searchable={props.searchable ?? true} />;
};
