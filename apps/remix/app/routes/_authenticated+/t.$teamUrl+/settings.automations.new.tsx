import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { trpc } from '@signflow/trpc/react';
import { Button } from '@signflow/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@signflow/ui/primitives/card';
import { Input } from '@signflow/ui/primitives/input';
import { Label } from '@signflow/ui/primitives/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@signflow/ui/primitives/select';
import { Textarea } from '@signflow/ui/primitives/textarea';
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';

import { SettingsHeader } from '~/components/general/settings-header';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

const ZCreateAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  triggerType: z.enum(['DOCUMENT_COMPLETED', 'DOCUMENT_SIGNED', 'DOCUMENT_REJECTED', 'ALL_SIGNED']),
  triggerConfig: z
    .object({
      templateId: z.string().optional(),
      senderEmail: z.string().email().optional(),
    })
    .optional(),
  actions: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(['SEND_EMAIL', 'SEND_SLACK', 'SEND_WEBHOOK']),
        config: z.object({
          email: z.string().email().optional().or(z.literal('')),
          subject: z.string().optional(),
          body: z.string().optional(),
          channel: z.string().optional(),
          message: z.string().optional(),
          url: z.string().url().optional().or(z.literal('')),
          headers: z.record(z.string()).optional(),
        }),
        order: z.number().int().min(0).default(0),
      }),
    )
    .min(1, 'At least one action is required'),
});

type FormData = z.infer<typeof ZCreateAutomationSchema>;

export function meta() {
  return appMetaTags(msg`New Automation`);
}

const triggerOptions = [
  { value: 'DOCUMENT_COMPLETED', label: 'Document Completed' },
  { value: 'DOCUMENT_SIGNED', label: 'Document Signed' },
  { value: 'DOCUMENT_REJECTED', label: 'Document Rejected' },
  { value: 'ALL_SIGNED', label: 'All Recipients Signed' },
];

const actionTypeOptions = [
  { value: 'SEND_EMAIL', label: 'Send Email' },
  { value: 'SEND_SLACK', label: 'Send Slack Message' },
  { value: 'SEND_WEBHOOK', label: 'Send Webhook' },
];

export default function NewAutomationPage() {
  const { t } = useLingui();
  const team = useCurrentTeam();
  const navigate = useNavigate();

  const createMutation = trpc.automation.create.useMutation({
    onSuccess: () => {
      navigate(`/t/${team.url}/settings/automations`);
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(ZCreateAutomationSchema),
    defaultValues: {
      name: '',
      description: '',
      enabled: true,
      triggerType: 'DOCUMENT_COMPLETED',
      triggerConfig: {},
      actions: [
        {
          type: 'SEND_EMAIL',
          config: {},
          order: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'actions',
  });

  const watchActionTypes = watch('actions');

  const [headerEntries, setHeaderEntries] = useState<Record<number, { key: string; value: string }[]>>({});

  const onSubmit = (data: FormData) => {
    const cleanedActions = data.actions.map((action, index) => {
      const config: Record<string, unknown> = {};

      if (action.type === 'SEND_EMAIL') {
        if (action.config.email) {
          config.email = action.config.email;
        }
        if (action.config.subject) {
          config.subject = action.config.subject;
        }
        if (action.config.body) {
          config.body = action.config.body;
        }
      } else if (action.type === 'SEND_SLACK') {
        if (action.config.channel) {
          config.channel = action.config.channel;
        }
        if (action.config.message) {
          config.message = action.config.message;
        }
      } else if (action.type === 'SEND_WEBHOOK') {
        if (action.config.url) {
          config.url = action.config.url;
        }
        const headers = headerEntries[index];
        if (headers && headers.length > 0) {
          const headerRecord: Record<string, string> = {};
          for (const entry of headers) {
            if (entry.key) {
              headerRecord[entry.key] = entry.value;
            }
          }
          if (Object.keys(headerRecord).length > 0) {
            config.headers = headerRecord;
          }
        }
      }

      return {
        type: action.type,
        config,
        order: action.order,
      };
    });

    createMutation.mutate({
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      triggerType: data.triggerType,
      triggerConfig: data.triggerConfig,
      actions: cleanedActions,
    });
  };

  const addHeaderRow = (index: number) => {
    setHeaderEntries((prev) => ({
      ...prev,
      [index]: [...(prev[index] || []), { key: '', value: '' }],
    }));
  };

  const updateHeaderRow = (actionIndex: number, rowIndex: number, field: 'key' | 'value', value: string) => {
    setHeaderEntries((prev) => {
      const rows = [...(prev[actionIndex] || [])];
      rows[rowIndex] = { ...rows[rowIndex], [field]: value };
      return { ...prev, [actionIndex]: rows };
    });
  };

  const removeHeaderRow = (actionIndex: number, rowIndex: number) => {
    setHeaderEntries((prev) => {
      const rows = [...(prev[actionIndex] || [])];
      rows.splice(rowIndex, 1);
      return { ...prev, [actionIndex]: rows };
    });
  };

  return (
    <div>
      <SettingsHeader title={t`New Automation`} subtitle={t`Create a new automation workflow for your documents.`}>
        <Button variant="outline" asChild>
          <Link to={`/t/${team.url}/settings/automations`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            <Trans>Back</Trans>
          </Link>
        </Button>
      </SettingsHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Basic Information</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Name your automation and choose when it should trigger.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset disabled={isSubmitting}>
              <div className="space-y-2">
                <Label htmlFor="name">
                  <Trans>Name</Trans>
                </Label>
                <Input id="name" {...register('name')} placeholder={t`My Automation`} />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  <Trans>Description</Trans>
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t`Optional description of what this automation does`}
                />
                {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="triggerType">
                  <Trans>Trigger Event</Trans>
                </Label>
                <Select
                  defaultValue="DOCUMENT_COMPLETED"
                  onValueChange={(value) => setValue('triggerType', value as FormData['triggerType'])}
                >
                  <SelectTrigger id="triggerType">
                    <SelectValue placeholder={t`Select a trigger event`} />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.triggerType && <p className="text-destructive text-sm">{errors.triggerType.message}</p>}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Actions</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>Define what happens when the trigger event occurs.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset disabled={isSubmitting}>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      <Trans>Action #{index + 1}</Trans>
                    </span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`actions.${index}.type`}>
                      <Trans>Action Type</Trans>
                    </Label>
                    <Select
                      defaultValue={field.type}
                      onValueChange={(value) =>
                        setValue(`actions.${index}.type`, value as FormData['actions'][number]['type'])
                      }
                    >
                      <SelectTrigger id={`actions.${index}.type`}>
                        <SelectValue placeholder={t`Select action type`} />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {watchActionTypes?.[index]?.type === 'SEND_EMAIL' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`actions.${index}.config.email`}>
                          <Trans>Recipient Email</Trans>
                        </Label>
                        <Input
                          id={`actions.${index}.config.email`}
                          {...register(`actions.${index}.config.email`)}
                          placeholder="recipient@example.com"
                          type="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`actions.${index}.config.subject`}>
                          <Trans>Subject</Trans>
                        </Label>
                        <Input
                          id={`actions.${index}.config.subject`}
                          {...register(`actions.${index}.config.subject`)}
                          placeholder={t`Document update`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`actions.${index}.config.body`}>
                          <Trans>Body</Trans>
                        </Label>
                        <Textarea
                          id={`actions.${index}.config.body`}
                          {...register(`actions.${index}.config.body`)}
                          placeholder={t`Your document has been updated.`}
                        />
                      </div>
                    </div>
                  )}

                  {watchActionTypes?.[index]?.type === 'SEND_SLACK' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`actions.${index}.config.channel`}>
                          <Trans>Channel</Trans>
                        </Label>
                        <Input
                          id={`actions.${index}.config.channel`}
                          {...register(`actions.${index}.config.channel`)}
                          placeholder="#general"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`actions.${index}.config.message`}>
                          <Trans>Message</Trans>
                        </Label>
                        <Textarea
                          id={`actions.${index}.config.message`}
                          {...register(`actions.${index}.config.message`)}
                          placeholder={t`A document has been completed!`}
                        />
                      </div>
                    </div>
                  )}

                  {watchActionTypes?.[index]?.type === 'SEND_WEBHOOK' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`actions.${index}.config.url`}>
                          <Trans>Webhook URL</Trans>
                        </Label>
                        <Input
                          id={`actions.${index}.config.url`}
                          {...register(`actions.${index}.config.url`)}
                          placeholder="https://example.com/webhook"
                          type="url"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>
                            <Trans>Headers</Trans>
                          </Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => addHeaderRow(index)}>
                            <PlusIcon className="mr-1 h-3 w-3" />
                            <Trans>Add Header</Trans>
                          </Button>
                        </div>
                        {(headerEntries[index] || []).map((header, hIndex) => (
                          <div key={hIndex} className="flex items-center gap-2">
                            <Input
                              placeholder={t`Key`}
                              value={header.key}
                              onChange={(e) => updateHeaderRow(index, hIndex, 'key', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              placeholder={t`Value`}
                              value={header.value}
                              onChange={(e) => updateHeaderRow(index, hIndex, 'value', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHeaderRow(index, hIndex)}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  append({
                    type: 'SEND_EMAIL',
                    config: {},
                    order: fields.length,
                  })
                }
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                <Trans>Add Action</Trans>
              </Button>

              {errors.actions && <p className="text-destructive text-sm">{errors.actions.message}</p>}
            </fieldset>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link to={`/t/${team.url}/settings/automations`}>
              <Trans>Cancel</Trans>
            </Link>
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Trans>Create Automation</Trans>
          </Button>
        </div>
      </form>
    </div>
  );
}
