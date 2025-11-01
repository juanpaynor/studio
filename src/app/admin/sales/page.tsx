import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesView } from '@/components/admin/sales/SalesView';

export default function SalesPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="font-headline text-3xl font-bold mb-6">Sales Reports</h1>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
            <SalesView period="daily" />
        </TabsContent>
        <TabsContent value="weekly">
            <SalesView period="weekly" />
        </TabsContent>
        <TabsContent value="monthly">
            <SalesView period="monthly" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
