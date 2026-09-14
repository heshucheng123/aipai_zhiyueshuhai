'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { defaultSiteContent, type SiteContentDocument } from '@/content/site-content';

const SiteContentContext = createContext<SiteContentDocument>(defaultSiteContent);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContentDocument>(defaultSiteContent);

  useEffect(() => {
    let active = true;
    const load = () => {
      void fetch('/api/content', { cache: 'no-store' })
        .then(async (response): Promise<{ content?: SiteContentDocument } | null> => response.ok ? await response.json() as { content?: SiteContentDocument } : null)
        .then((payload) => {
          if (active && payload?.content) setContent(payload.content);
        })
        .catch(() => undefined);
    };
    load();
    window.addEventListener('site-content-updated', load);
    return () => {
      active = false;
      window.removeEventListener('site-content-updated', load);
    };
  }, []);

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
