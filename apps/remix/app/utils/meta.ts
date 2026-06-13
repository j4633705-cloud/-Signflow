import { i18n, type MessageDescriptor } from '@lingui/core';
import { NEXT_PUBLIC_WEBAPP_URL } from '@signflow/lib/constants/app';

export const appMetaTags = (title?: MessageDescriptor) => {
  const description =
    'SignFlow is a professional digital signature platform for teams that need secure document workflows, reusable templates, audit trails, automations, and developer-friendly APIs.';

  return [
    {
      title: title ? `${i18n._(title)} - SignFlow` : 'SignFlow',
    },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content:
        'SignFlow, digital signature, electronic signature, document workflows, signing platform, document automation, templates, audit trails, API',
    },
    {
      name: 'author',
      content: 'SignFlow',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      property: 'og:title',
      content: 'SignFlow - Digital signature workflows for modern teams',
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '@SignFlow',
    },
    {
      name: 'twitter:description',
      content: description,
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
  ];
};
