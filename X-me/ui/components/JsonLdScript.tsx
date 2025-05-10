'use client';

interface JsonLdScriptProps {
  type?: 'Organization' | 'WebSite' | 'FAQPage' | 'Product' | 'Article' | 'BreadcrumbList';
  data?: Record<string, any>;
}

/**
 * Composant pour injecter des données structurées JSON-LD dans la page
 * Plus d'infos: https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data
 */
export default function JsonLdScript({ type = 'Organization', data }: JsonLdScriptProps) {
  // Données par défaut pour une organisation
  const defaultOrganizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Xandme',
    url: 'https://xandme.fr',
    logo: 'https://xandme.fr/images/logo.svg',
    sameAs: [],
    description: 'Xandme est une plateforme de mise en relation avec des experts.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'FR'
    }
  };

  // Données par défaut pour un site web
  const defaultWebsiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Xandme',
    url: 'https://xandme.fr',
    potentialAction: {
      '@type': 'SearchAction',
      'target': 'https://xandme.fr/discover?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  let structuredData;

  switch (type) {
    case 'Organization':
      structuredData = { ...defaultOrganizationData, ...data };
      break;
    case 'WebSite':
      structuredData = { ...defaultWebsiteData, ...data };
      break;
    default:
      structuredData = { '@context': 'https://schema.org', '@type': type, ...data };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 