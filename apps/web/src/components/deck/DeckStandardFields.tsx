import React, { useMemo, useEffect } from 'react';
import { CountryFlag } from '../language/CountryFlag';
import { CustomDropdown } from '../common/CustomDropdown';
import { SUPPORTED_LANGUAGES, getLanguage } from '../../config/languages';
import {
  getLanguageStandard,
  getCertificatesForLanguage,
  getCategoriesForLanguage,
  CertificateInfo,
  CertificateLevel,
} from '../../config/languageStandards';
import { Globe, Award, Layers, Tag } from 'lucide-react';

export interface DeckStandardFieldsProps {
  languageId: string;
  onLanguageChange?: (langId: string) => void;
  allowLanguageChange?: boolean;
  category: string;
  onCategoryChange: (category: string) => void;
  certificateId?: string;
  onCertificateChange?: (certificateId: string) => void;
  level: string;
  onLevelChange: (level: string) => void;
  customCategories?: string[];
  onAddCustomCategory?: (newCategory: string) => void;
  className?: string;
  gridCols?: 2 | 3 | 4;
}

export const DeckStandardFields: React.FC<DeckStandardFieldsProps> = ({
  languageId,
  onLanguageChange,
  allowLanguageChange = false,
  category,
  onCategoryChange,
  certificateId,
  onCertificateChange,
  level,
  onLevelChange,
  customCategories = [],
  onAddCustomCategory,
  className = '',
  gridCols = 3,
}) => {
  const langDef = useMemo(() => getLanguage(languageId), [languageId]);
  const langStd = useMemo(() => getLanguageStandard(languageId), [languageId]);

  // Available certificates for current language
  const certificates = useMemo(() => {
    return getCertificatesForLanguage(languageId);
  }, [languageId]);

  // Selected certificate info
  const selectedCert = useMemo(() => {
    if (certificateId) {
      const found = certificates.find((c) => c.id === certificateId);
      if (found) return found;
    }
    // Try to match from current level value
    for (const c of certificates) {
      if (c.levels.some((l) => l.id === level || l.name === level || l.badge === level)) {
        return c;
      }
    }
    return certificates[0];
  }, [certificates, certificateId, level]);

  // When language changes, auto-align certificate, level, and category if current values are foreign
  useEffect(() => {
    // If selectedCert not in this language's certificates, reset to default cert
    const hasCert = certificates.some((c) => c.id === certificateId);
    if (!hasCert && certificates.length > 0) {
      const defaultCert = certificates.find((c) => c.id === langStd.defaultCertificateId) || certificates[0];
      if (onCertificateChange) onCertificateChange(defaultCert.id);
      if (defaultCert.levels.length > 0 && !defaultCert.levels.some((l) => l.id === level || l.name === level)) {
        onLevelChange(defaultCert.levels[0].name);
      }
    }

    // Check category: if current category is an English preset like 'Business English' while language is not 'en'
    if (languageId !== 'en' && (category === 'Business English' || category === 'TOEIC Test' || category === 'IELTS Academic')) {
      const defaultCat = langStd.categories[0]?.name;
      if (defaultCat) {
        onCategoryChange(defaultCat);
      }
    }
  }, [languageId, certificates, langStd]);

  // Categories list: language specific + custom user categories
  const categoryOptions = useMemo(() => {
    const list: string[] = [];
    // 1. Language standard categories
    langStd.categories.forEach((cat) => {
      if (!list.includes(cat.name)) list.push(cat.name);
    });
    // 2. Custom user categories
    customCategories.forEach((cat) => {
      if (!list.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        list.push(cat);
      }
    });
    // 3. Ensure current category is in options
    if (category && !list.includes(category)) {
      list.push(category);
    }
    return list.map((c) => ({ value: c, label: c }));
  }, [langStd, customCategories, category]);

  // Certificate options dropdown
  const certificateOptions = useMemo(() => {
    return certificates.map((c) => ({
      value: c.id,
      label: c.name,
      badge: `${c.levels.length} cấp độ`,
      description: c.description,
    }));
  }, [certificates]);

  // Level options based on selected certificate
  const levelOptions = useMemo(() => {
    const activeLevels = selectedCert?.levels || [];
    return activeLevels.map((lvl) => ({
      value: lvl.name, // using display name for backwards compatibility
      label: lvl.name,
      badge: lvl.badge,
    }));
  }, [selectedCert]);

  const handleCertificateSelect = (newCertId: string) => {
    if (onCertificateChange) {
      onCertificateChange(newCertId);
    }
    const foundCert = certificates.find((c) => c.id === newCertId);
    if (foundCert && foundCert.levels.length > 0) {
      // Set to first level of the new certificate
      onLevelChange(foundCert.levels[0].name);
    }
  };

  const handleCreateCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (onAddCustomCategory) {
      onAddCustomCategory(trimmed);
    }
    onCategoryChange(trimmed);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`grid grid-cols-1 ${
          gridCols === 4
            ? 'sm:grid-cols-2 lg:grid-cols-4'
            : gridCols === 2
            ? 'sm:grid-cols-2'
            : 'sm:grid-cols-3'
        } gap-3 sm:gap-4 items-end`}
      >
        {/* 1. Language Space */}
        <div>
          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>Không gian học tập</span>
          </label>
          {allowLanguageChange && onLanguageChange ? (
            <CustomDropdown
              value={languageId}
              onChange={(val) => onLanguageChange(val)}
              options={SUPPORTED_LANGUAGES.filter((l) => l.enabled).map((l) => ({
                value: l.id,
                label: `${l.nativeName} (${l.name})`,
                icon: <CountryFlag languageId={l.id} size="sm" />,
              }))}
              size="md"
              className="w-full"
            />
          ) : (
            <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-900 dark:text-white">
              <CountryFlag languageId={languageId} size="sm" />
              <span className="truncate">
                {langDef.nativeName} ({langDef.name})
              </span>
            </div>
          )}
        </div>

        {/* 2. Certificate / Standard Framework */}
        <div>
          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Chứng chỉ / Tiêu chuẩn</span>
          </label>
          <CustomDropdown
            value={selectedCert?.id || certificates[0]?.id || 'general'}
            onChange={handleCertificateSelect}
            options={certificateOptions}
            size="md"
            className="w-full"
          />
        </div>

        {/* 3. Level within selected certificate */}
        <div>
          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm truncate flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>Cấp độ ({selectedCert?.name || langDef.nativeName})</span>
          </label>
          <CustomDropdown
            value={level}
            onChange={(val) => onLevelChange(val)}
            options={levelOptions}
            size="md"
            className="w-full"
          />
        </div>

        {/* 4. Domain / Category */}
        <div className={gridCols === 3 ? 'sm:col-span-3' : ''}>
          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-500" />
            <span>Lĩnh vực / Danh mục ({langDef.nativeName})</span>
          </label>
          <CustomDropdown
            value={category}
            onChange={(val) => onCategoryChange(val)}
            options={categoryOptions}
            searchable={true}
            searchPlaceholder="Tìm kiếm hoặc tạo danh mục mới..."
            creatable={true}
            createPlaceholder='Tạo danh mục mới: "{query}"'
            onCreateOption={handleCreateCategory}
            size="md"
            className="w-full"
          />
        </div>
      </div>

      {/* Helpful banner explaining selected certificate & category */}
      {selectedCert?.description && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300">
          <Award className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
          <span className="font-medium">
            <strong className="font-bold">{selectedCert.fullName || selectedCert.name}:</strong>{' '}
            {selectedCert.description}
          </span>
        </div>
      )}
    </div>
  );
};
