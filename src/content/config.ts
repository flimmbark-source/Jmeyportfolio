import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'data',
  schema: z.object({
    order: z.number(),
    slug: z.string(),
    title: z.string(),
    tagline: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()),
    image: z
      .object({
        src: z.string(),
        alt: z.string()
      })
      .optional(),
    links: z
      .array(
        z.object({
          href: z.string(),
          label: z.string(),
          variant: z.enum(['primary', 'secondary']).default('primary'),
          external: z.boolean().optional()
        })
      )
      .optional(),
    caseStudy: z.record(z.any()).optional()
  })
});

const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    quote: z.string(),
    source: z.string(),
    highlights: z.array(z.string())
  })
});

export const collections = { projects, testimonials };
