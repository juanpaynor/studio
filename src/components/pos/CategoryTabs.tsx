import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sandwich, Soup, GlassWater } from 'lucide-react';

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
  Sandwiches: <Sandwich className="mr-2 h-5 w-5" />,
  Sides: <Soup className="mr-2 h-5 w-5" />,
  Drinks: <GlassWater className="mr-2 h-5 w-5" />,
};

export default function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  // Memoize the tabs to prevent re-renders
  const tabTriggers = React.useMemo(() => {
    return categories.map((category) => (
      <TabsTrigger
        key={category}
        value={category}
        className="flex items-center text-base"
      >
        {categoryIcons[category]}
        {category}
      </TabsTrigger>
    ));
  }, [categories]);

  return (
    <div className="mb-4">
      <Tabs
        value={selectedCategory}
        onValueChange={onSelectCategory}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          {tabTriggers}
        </TabsList>
      </Tabs>
    </div>
  );
}
