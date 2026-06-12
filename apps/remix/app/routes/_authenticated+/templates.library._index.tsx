import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { trpc } from '@signflow/trpc/react';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { Input } from '@signflow/ui/primitives/input';
import { useToast } from '@signflow/ui/primitives/use-toast';
import { CopyIcon, LoaderIcon, SearchIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Template Library`);
}

export default function TemplateLibraryPage() {
  const team = useCurrentTeam();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.template.findPublicTemplates.useInfiniteQuery(
      {
        search,
        limit: 12,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const duplicateMutation = trpc.template.duplicateTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: 'Template duplicated',
        description: 'The template has been added to your templates.',
      });

      navigate(`/t/${team.url}/templates`);
    },
    onError: () => {
      toast({
        title: 'Something went wrong',
        description: 'Failed to duplicate the template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const templates = data?.pages.flatMap((page) => page.templates) ?? [];

  const handleSearch = () => {
    // The search value is already captured in state, just trigger a refetch.
    // useInfiniteQuery refetches when the input changes automatically.
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">
          <Trans>Template Library</Trans>
        </h1>
        <p className="mt-1 text-muted-foreground">
          <Trans>Browse and use public templates created by the community</Trans>
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch}>
          <Trans>Search</Trans>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-y-4 text-muted-foreground/60">
          <CopyIcon className="h-12 w-12" strokeWidth={1.5} />
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              <Trans>No templates found</Trans>
            </h3>
            <p className="mt-2 max-w-[50ch]">
              <Trans>There are no public templates available yet. Check back later or create your own.</Trans>
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.envelopeId} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{template.publicTitle}</CardTitle>
                  {template.publicDescription && (
                    <CardDescription className="line-clamp-3">{template.publicDescription}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-col gap-1 text-muted-foreground text-sm">
                    {template.teamName && (
                      <span>
                        <Trans>By</Trans> {template.teamName}
                      </span>
                    )}
                    <span>
                      <Trans>Created</Trans> {DateTime.fromJSDate(template.createdAt).toLocaleString(DateTime.DATE_MED)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => duplicateMutation.mutate({ templateId: template.id })}
                    disabled={duplicateMutation.isPending}
                  >
                    {duplicateMutation.isPending ? (
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CopyIcon className="mr-2 h-4 w-4" />
                    )}
                    <Trans>Use Template</Trans>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline" size="lg">
                {isFetchingNextPage ? <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                <Trans>Load more</Trans>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
