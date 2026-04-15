import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <h1 className="p-4 text-xl font-semibold">Wedding Photo Selector</h1>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
