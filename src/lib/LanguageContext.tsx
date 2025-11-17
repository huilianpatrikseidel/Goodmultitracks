import React, { createContext, useContext, useState, useMemo } from 'react';
import { Language, Translations, getTranslation } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

// Initialize context with undefined, the check in useLanguage handles the error
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check if running in a browser environment before accessing localStorage
    try { // Add try-catch for environments where localStorage might be restricted
        const saved = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
        // Ensure the saved value is one of the allowed types
        if (saved === 'pt' || saved === 'en') {
            return saved;
        }
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
    // VVVVVV --- ALTERAÇÃO AQUI --- VVVVVV
    return 'pt'; // Define 'pt' como o padrão
    // ^^^^^^ --- ALTERAÇÃO AQUI --- ^^^^^^
  });

  const setLanguage = (lang: Language) => {
    // Ensure lang is a valid language before setting
    if (lang === 'en' || lang === 'pt') {
        setLanguageState(lang);
        // Check if running in a browser environment
        try { // Add try-catch
            if (typeof window !== 'undefined') {
                localStorage.setItem('language', lang);
            }
        } catch (e) {
             console.error("Could not access localStorage:", e);
        }
    } else {
        console.warn("Attempted to set invalid language:", lang);
    }
  };

  // getTranslation should handle the language state correctly
  const t = getTranslation(language);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]); // Add t as dependency

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) { // << CORREÇÃO: Verificar se é 'undefined' não apenas falsy
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}