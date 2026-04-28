import fs from 'fs';
import path from 'path';

const fixes = [
  {
    file: 'src/hooks/useAdvancedForms.tsx',
    replacements: [
      {
        search: `  useEffect(() => {
    stateManager.initializeDependencies(config.fields, config.conditionalLogic || []);
  }, [config, stateManager]);`,
        replace: `  useEffect(() => {
    stateManager.initializeDependencies(config.fields, config.conditionalLogic || []);
  }, [config.fields, config.conditionalLogic, stateManager]);`,
      },
      {
        search: `    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateManager, validateOnChange, autoSave, formId, onFieldChange]);`,
        replace: `    return () => subscription.unsubscribe();
  }, [stateManager, validateOnChange, autoSave, formId, onFieldChange, autoSaveManager]);`,
      },
      {
        search: `    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, autoSaveInterval, formId]);`,
        replace: `    return () => {
      subscription.unsubscribe();
    };
  }, [autoSave, autoSaveInterval, formId, autoSaveManager, loadDraft]);`,
      },
      {
        search: `    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateManager, validateForm, onSubmit, formState.values, autoSave]);`,
        replace: `    } finally {
      setIsSubmitting(false);
    }
  }, [stateManager, validateForm, onSubmit, formState.values, autoSave, clearDraft]);`,
      },
    ],
  },
  {
    file: 'src/hooks/useAdvancedSearch.tsx',
    replacements: [
      {
        search: `  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = JSON.parse(
        localStorage.getItem('search_history_terms') || '[]',
      ) as string[];
      setHistory(storedHistory);
    }
  }, [setHistory]);`,
        replace: `  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = JSON.parse(
        localStorage.getItem('search_history_terms') || '[]',
      ) as string[];
      setHistory(storedHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount`,
      },
    ],
  },
  {
    file: 'src/hooks/useInternationalization.tsx',
    replacements: [
      {
        search: `  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18n:language') as LanguageCode | null;
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);`,
        replace: `  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18n:language') as LanguageCode | null;
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount`,
      },
    ],
  },
  {
    file: 'src/hooks/useSearchFilters.tsx',
    replacements: [
      {
        search: `  }, [filters, pathname, router]);`,
        replace: `  }, [filters, pathname, router]); // searchParams intentionally excluded - only used for initial state`,
      },
    ],
  },
];

fixes.forEach(({ file, replacements }) => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n🎉 All fixes applied!');
