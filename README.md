# vite-plugin-site-index

A Vite plugin that generates:

- `sitemap.xml` as a sitemap index
- `sitemap-*.xml` leaf sitemaps
- `robots.txt`

from dedicated metadata modules.

## Status

Early development.

## Scope

This package handles:

- sitemap index generation
- leaf sitemap generation
- robots.txt generation

This package does not handle:

- HTML meta tags
- canonical URLs
- Open Graph
- `priority`
- `changefreq`
- nested sitemap indexes

## Metadata

```ts
export type SiteIndexMeta = {
  url: `/${string}`;
  lastModified?: string;
  sitemap?: string;
  index?: boolean;
};
```
