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
  return (
    <div className="mb-4">
      <Tabs
        value={selectedCategory}
        onValueChange={onSelectCategory}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="flex items-center text-base"
            >
              {categoryIcons[category]}
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
