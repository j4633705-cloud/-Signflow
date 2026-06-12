import { Trans } from '@lingui/react/macro';
import { cn } from '@signflow/ui/lib/utils';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { Progress } from '@signflow/ui/primitives/progress';
import { CheckCircle2Icon, CircleIcon, FilePlusIcon, RocketIcon, SendIcon, XIcon } from 'lucide-react';
import { Link } from 'react-router';

export type OnboardingCardProps = {
  documentCount: number;
  completedCount: number;
  pendingCount: number;
  teamUrl: string;
  onDismiss: () => void;
};

export const OnboardingCard = ({
  documentCount,
  completedCount,
  pendingCount,
  teamUrl,
  onDismiss,
}: OnboardingCardProps) => {
  const stepsCompleted = [documentCount > 0, pendingCount > 0, completedCount > 0];

  const completedSteps = stepsCompleted.filter(Boolean).length;
  const totalSteps = stepsCompleted.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <Card className="relative mb-8 border-blue-100 dark:border-blue-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              <Trans>Get started with SignFlow</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Complete these steps to start sending and signing documents.</Trans>
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-2 h-8 w-8" onClick={onDismiss} aria-label="Dismiss">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <Trans>Progress</Trans>
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          <StepItem
            icon={FilePlusIcon}
            title="Create your first document"
            description="Upload a PDF or create a document from a template."
            href={`/t/${teamUrl}/documents`}
            isDone={documentCount > 0}
          />

          <StepItem
            icon={SendIcon}
            title="Send for signature"
            description="Add recipients and send your document for signature."
            href={`/t/${teamUrl}/documents?status=PENDING`}
            isDone={pendingCount > 0}
          />

          <StepItem
            icon={RocketIcon}
            title="Complete a signature"
            description="Sign a document or have your recipients sign."
            href={`/t/${teamUrl}/documents?status=COMPLETED`}
            isDone={completedCount > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
};

type StepItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  isDone: boolean;
};

const StepItem = ({ icon: Icon, title, description, href, isDone }: StepItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4 transition-colors',
        isDone ? 'border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/50' : 'border-border',
      )}
    >
      <div className="shrink-0">
        {isDone ? (
          <CheckCircle2Icon className="h-6 w-6 text-green-500" />
        ) : (
          <CircleIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className={cn('font-medium', isDone && 'text-muted-foreground line-through')}>{title}</p>
        <p className={cn('text-muted-foreground text-sm', isDone && 'opacity-60')}>{description}</p>
      </div>
      <Button asChild variant={isDone ? 'outline' : 'default'} size="sm">
        <Link to={href}>{isDone ? 'Done' : 'Go'}</Link>
      </Button>
    </div>
  );
};
