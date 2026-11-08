import type {MDXComponents} from 'mdx/types';
import {Tex} from '@/components/Math';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {Tex, ...components};
}
