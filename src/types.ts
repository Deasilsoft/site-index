export type SiteIndexMeta = {
  url: `/${string}`;
  lastModified?: string;
  sitemap?: string;
  index?: boolean;
};

export type ResolvedSiteIndexEntry = {
  url: `/${string}`;
  lastModified?: string;
  sitemap: string;
  index: boolean;
};

export type SiteIndexPluginOptions = {
  siteUrl: string;
  include?: string | string[];
  exclude?: string | string[];
  userAgent?: string;
};
