/**
 * Structured Data Utilities
 * Generates JSON-LD structured data for SEO and accessibility
 * Follows schema.org specifications
 */

export interface StructuredDataFilterOption {
  id: string;
  label: string;
  value?: string;
  description?: string;
}

export interface StructuredDataFilterGroup {
  id: string;
  name: string;
  description?: string;
  options: StructuredDataFilterOption[];
  type: 'checkbox' | 'radio' | 'select' | 'range' | 'multiselect';
}

/**
 * Generates JSON-LD structured data for filter controls
 * Uses schema.org ItemList to represent filterable options
 */
export function generateFilterStructuredData(filterGroups: StructuredDataFilterGroup[]): string {
  const itemListElement = filterGroups.map((group, _groupIndex) => ({
    '@type': 'ItemList',
    name: group.name,
    description: group.description,
    itemListElement: group.options.map((option, optionIndex) => ({
      '@type': 'ListItem',
      position: optionIndex + 1,
      name: option.label,
      identifier: option.id,
      description: option.description,
    })),
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FilterControls',
    name: 'Search Filters',
    description: 'Filter controls for content search and navigation',
    itemListElement,
  };

  return JSON.stringify(structuredData);
}

/**
 * Generates JSON-LD structured data for breadcrumb navigation
 * Useful for filter state tracking
 */
export function generateBreadcrumbStructuredData(items: { name: string; url?: string }[]): string {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };

  return JSON.stringify(structuredData);
}

/**
 * Generates JSON-LD structured data for a single filter group
 * Uses schema.org PropertyValueSpecification
 */
export function generateFilterGroupStructuredData(group: StructuredDataFilterGroup): string {
  const valueSpecification = group.options.map((option) => ({
    '@type': 'PropertyValueSpecification',
    valueName: option.id,
    valueRequired: false,
    description: option.description || option.label,
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'PropertyValueSpecification',
    name: group.name,
    description: group.description,
    valueSpecification,
  };

  return JSON.stringify(structuredData);
}

/**
 * Validates JSON-LD structured data
 * Checks for required fields and proper structure
 */
export function validateStructuredData(jsonLd: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const data = JSON.parse(jsonLd);

    if (!data['@context']) {
      errors.push('Missing @context field');
    }

    if (!data['@type']) {
      errors.push('Missing @type field');
    }

    const context = data['@context'];
    const hasSchemaOrgContext =
      typeof context === 'string'
        ? context.includes('schema.org')
        : Array.isArray(context) &&
          context.some((entry) => typeof entry === 'string' && entry.includes('schema.org'));

    if (context && !hasSchemaOrgContext) {
      errors.push('@context must include schema.org');
    }

    return { valid: errors.length === 0, errors };
  } catch (_error) {
    return { valid: false, errors: ['Invalid JSON format'] };
  }
}
