import { useEffect } from 'react';

/* Client-side routing means the document title and description have to be set
   per page by hand. Crawlers that don't run JS see the shell's defaults. */
export default function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title;
    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute('content', description);
  }, [title, description]);
}
