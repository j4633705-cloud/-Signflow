import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { SUPPORTED_LANGUAGES } from '@signflow/lib/constants/i18n';
import { dynamicActivate } from '@signflow/lib/utils/i18n';
import { cn } from '@signflow/ui/lib/utils';
import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from '@signflow/ui/primitives/command';
import { CheckIcon } from 'lucide-react';

type LanguageSwitcherDialogProps = {
  open: boolean;
  setOpen: (_open: boolean) => void;
};

export const LanguageSwitcherDialog = ({ open, setOpen }: LanguageSwitcherDialogProps) => {
  const { i18n, _ } = useLingui();

  const setLanguage = async (lang: string) => {
    setOpen(false);

    await dynamicActivate(lang);

    const formData = new FormData();

    formData.append('lang', lang);

    await fetch('/api/locale', {
      method: 'post',
      body: formData,
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={_(msg`Search languages...`)} />

      <CommandList>
        <CommandGroup>
          {Object.values(SUPPORTED_LANGUAGES).map((language) => (
            <CommandItem
              key={language.short}
              value={_(language.full)}
              onSelect={async () => setLanguage(language.short)}
            >
              <CheckIcon className={cn('mr-2 h-4 w-4', i18n.locale === language.short ? 'opacity-100' : 'opacity-0')} />
              {_(language.full)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
