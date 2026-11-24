import { lessonsA, GRUNNLEGGENDE, LOGIKK, TELLING } from './lessons-a';
import { lessonsB, OPPSLAG, TEKST, DATO, OKONOMI } from './lessons-b';
import type { Lesson } from './types';

export type { Lesson };
export const MODULES = [GRUNNLEGGENDE, LOGIKK, TELLING, OPPSLAG, TEKST, DATO, OKONOMI];

export const LESSONS: (Lesson & { nr: number })[] = [...lessonsA, ...lessonsB]
  .sort((a, b) => MODULES.indexOf(a.module) - MODULES.indexOf(b.module))
  .map((l, i) => ({ ...l, nr: i + 1 }));

export const FREE_COUNT = LESSONS.filter(l => l.free).length;
export const TASK_COUNT = LESSONS.reduce((s, l) => s + l.tasks.length, 0);

export const lessonBySlug = (slug: string) => LESSONS.find(l => l.slug === slug);
export const nextLesson = (slug: string) => {
  const i = LESSONS.findIndex(l => l.slug === slug);
  return i >= 0 ? LESSONS[i + 1] : undefined;
};
