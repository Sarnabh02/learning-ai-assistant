import type { Metadata } from 'next';
import { LearnPage } from '@/components/learn/LearnPage';

export const metadata: Metadata = {
  title: 'First Principles | Education Assistant',
  description: 'Understand any concept from its absolute foundations and test your knowledge.',
};

export default function LearnRoute() {
  return <LearnPage />;
}
