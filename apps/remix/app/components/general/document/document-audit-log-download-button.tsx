import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { downloadFile } from '@signflow/lib/client-only/download-file';
import { base64 } from '@signflow/lib/universal/base64';
import { trpc } from '@signflow/trpc/react';
import { cn } from '@signflow/ui/lib/utils';
import { Button } from '@signflow/ui/primitives/button';
import { useToast } from '@signflow/ui/primitives/use-toast';
import { DownloadIcon } from 'lucide-react';

export type DocumentAuditLogDownloadButtonProps = {
  className?: string;
  documentId: number;
};

export const DocumentAuditLogDownloadButton = ({ className, documentId }: DocumentAuditLogDownloadButtonProps) => {
  const { toast } = useToast();
  const { _ } = useLingui();

  const { mutateAsync: downloadAuditLogs, isPending } = trpc.document.auditLog.download.useMutation();

  const onDownloadAuditLogsClick = async () => {
    try {
      const { data, envelopeTitle } = await downloadAuditLogs({ documentId });

      const buffer = new Uint8Array(base64.decode(data));
      const blob = new Blob([buffer], { type: 'application/pdf' });

      downloadFile({
        data: blob,
        filename: `${envelopeTitle} - Audit Logs.pdf`,
      });
    } catch (error) {
      console.error(error);

      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`Sorry, we were unable to download the audit logs. Please try again later.`),
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      className={cn('w-full sm:w-auto', className)}
      loading={isPending}
      onClick={() => void onDownloadAuditLogsClick()}
    >
      {!isPending && <DownloadIcon className="mr-1.5 h-4 w-4" />}
      <Trans>Download Audit Logs</Trans>
    </Button>
  );
};
