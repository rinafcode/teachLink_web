/**
 * StructuredDataScript Component
 * Renders JSON-LD structured data as a script tag
 * Improves SEO and accessibility for filter controls
 */

'use client';

import React from 'react';

interface StructuredDataScriptProps {
  jsonLd: string;
  id?: string;
}

/**
 * Component to inject JSON-LD structured data into the page
 * Uses type="application/ld+json" for proper schema.org recognition
 */
export const StructuredDataScript = React.memo<StructuredDataScriptProps>(
  ({ jsonLd, id = 'structured-data' }) => {
    // Validate JSON-LD before rendering
    let isValid = true;
    try {
      JSON.parse(jsonLd);
    } catch {
      isValid = false;
    }

    // Only render if valid to avoid console errors
    if (!isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('StructuredDataScript: Invalid JSON-LD provided', jsonLd);
      }
      return null;
    }

    return (
      <script type="application/ld+json" id={id} dangerouslySetInnerHTML={{ __html: jsonLd }} />
    );
  },
);

StructuredDataScript.displayName = 'StructuredDataScript';
