import { useEffect } from 'react';
import { useTranslation } from '../i18n';

interface SEOOptions {
  title?: string;
  description?: string;
  noindex?: boolean;
}

export function usePageSEO(options: SEOOptions) {
  const { locale } = useTranslation();

  useEffect(() => {
    // 1. Dynamic Title
    if (options.title) {
      document.title = `${options.title} | VocabFlow`;
    }

    // 2. Meta description
    if (options.description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', options.description);
    }

    // 3. Robots meta (noindex for private pages)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (options.noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.setAttribute('content', 'index, follow');
    }

    // 4. HTML lang attribute
    document.documentElement.lang = locale;
  }, [options.title, options.description, options.noindex, locale]);
}
