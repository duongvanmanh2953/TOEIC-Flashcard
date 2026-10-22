import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LanguageDefinition,
  DEFAULT_LEARNING_LANGUAGE,
  getLanguage,
} from '../config/languages';

interface KidLearningContextType {
  activeLanguage: LanguageDefinition;
  switchLanguage: (languageId: string) => Promise<void>;
}

const KidLearningContext = createContext<KidLearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeLanguage, setActiveLanguage] = useState<LanguageDefinition>(() => {
    const saved = localStorage.getItem('letstun_kid_active_lang');
    return (saved && getLanguage(saved)) || DEFAULT_LEARNING_LANGUAGE;
  });

  const switchLanguage = async (languageId: string) => {
    const next = getLanguage(languageId) || DEFAULT_LEARNING_LANGUAGE;
    setActiveLanguage(next);
    localStorage.setItem('letstun_kid_active_lang', next.id);
  };

  return (
    <KidLearningContext.Provider value={{ activeLanguage, switchLanguage }}>
      {children}
    </KidLearningContext.Provider>
  );
};

export const useLearningContext = () => {
  const ctx = useContext(KidLearningContext);
  if (!ctx) {
    return {
      activeLanguage: DEFAULT_LEARNING_LANGUAGE,
      switchLanguage: async () => {},
    };
  }
  return ctx;
};
