import { NEXT_PUBLIC_WEBAPP_URL } from '@signflow/lib/constants/app';
import { getDocumentByAccessToken } from '@signflow/lib/server-only/document/get-document-by-access-token';
import { redirect, useLoaderData } from 'react-router';

import { DocumentCertificateQRView } from '~/components/general/document/document-certificate-qr-view';

import type { Route } from './+types/share.$slug';

export function meta({ params: { slug } }: Route.MetaArgs) {
  if (slug.startsWith('qr_')) {
    return undefined;
  }

  return [
    { title: 'signflow - Share' },
    { description: 'I just signed a document in style with signflow!' },
    {
      property: 'og:title',
      content: 'signflow - Join the open source signing revolution',
    },
    {
      property: 'og:description',
      content: 'I just signed with signflow!',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/share/${slug}/opengraph`,
    },
    {
      name: 'twitter:site',
      content: '@signflow',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/share/${slug}/opengraph`,
    },
    {
      name: 'twitter:description',
      content: 'I just signed with signflow!',
    },
  ];
}

export const loader = async ({ request, params: { slug } }: Route.LoaderArgs) => {
  if (slug.startsWith('qr_')) {
    const document = await getDocumentByAccessToken({ token: slug });

    if (!document) {
      throw redirect('/');
    }

    return {
      document,
      token: slug,
    };
  }

  const userAgent = request.headers.get('User-Agent') ?? '';

  if (/bot|facebookexternalhit|WhatsApp|google|bing|duckduckbot|MetaInspector/i.test(userAgent)) {
    return {};
  }

  // Is hardcoded because this whole meta is hardcoded anyway for signflow.
  throw redirect('https://signflow.com');
};

export default function SharePage() {
  const { document, token } = useLoaderData<typeof loader>();

  if (document) {
    return (
      <DocumentCertificateQRView
        documentId={document.id}
        title={document.title}
        documentTeamUrl={document.documentTeamUrl}
        internalVersion={document.internalVersion}
        envelopeItems={document.envelopeItems}
        recipientCount={document.recipientCount}
        completedDate={document.completedAt ?? undefined}
        token={token}
      />
    );
  }

  return <div></div>;
}
