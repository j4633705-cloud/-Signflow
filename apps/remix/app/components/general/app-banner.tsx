import type { TSiteSettingsBannerSchema } from '@signflow/lib/server-only/site-settings/schemas/banner';

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'br', 'span', 'u'];

const sanitizeHtml = (html: string): string => {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, (match) => {
    const tagName = match.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/)?.[1]?.toLowerCase();
    if (tagName && ALLOWED_TAGS.includes(tagName)) {
      return match;
    }
    return '';
  });
};

export type AppBannerProps = {
  banner: TSiteSettingsBannerSchema;
};

export const AppBanner = ({ banner }: AppBannerProps) => {
  if (!banner.enabled) {
    return null;
  }

  return (
    <div className="mb-2" style={{ background: banner.data.bgColor }}>
      <div
        className="mx-auto flex h-auto max-w-screen-xl items-center justify-center px-4 py-3 font-medium text-sm"
        style={{ color: banner.data.textColor }}
      >
        <div className="flex items-center">
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(banner.data.content) }} />
        </div>
      </div>
    </div>
  );
};

// Banner
// Custom Text
// Custom Text with Custom Icon
