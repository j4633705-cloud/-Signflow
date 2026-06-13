import * as TabsComponents from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from '@/components/mdx/mermaid';

// biome-ignore lint/suspicious/noExplicitAny: MDX components type is complex and provided by fumadocs
export function getMDXComponents(components?: MDXComponents): any {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    Mermaid,
    ...components,
  };
}
