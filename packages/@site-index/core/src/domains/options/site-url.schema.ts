import { z as Zod } from "zod";

export const SITE_URL_ERROR_MESSAGE =
  "siteUrl must be an HTTP(S) origin: protocol, hostname, and optional port only";

export const SiteUrlSchema = Zod.url({
  protocol: /^https?$/,
})
  .refine(
    (value) => {
      const url = new URL(value);

      return url.pathname === "/" && url.search === "" && url.hash === "";
    },
    {
      message: SITE_URL_ERROR_MESSAGE,
    },
  )
  .transform((value) => new URL(value).origin);
