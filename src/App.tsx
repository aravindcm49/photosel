import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { HomeScreen } from '@/screens/HomeScreen';
import { PhotoReviewScreen } from '@/screens/PhotoReviewScreen';
import type { Project } from '@/types';

type Screen = 'home' | 'review';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const handleOpenProject = (_project: Project, _dirHandle: FileSystemDirectoryHandle) => {
    setCurrentProject(_project);
    setScreen('review');
  };

  const handleResumeProject = (project: Project) => {
    setCurrentProject(project);
    setScreen('review');
  };

  const handleBackToHome = () => {
    setCurrentProject(null);
    setScreen('home');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {screen === 'home' && (
          <HomeScreen
            onOpenProject={handleOpenProject}
            onResumeProject={handleResumeProject}
          />
        )}
        {screen === 'review' && currentProject && (
          <PhotoReviewScreen
            folderName={currentProject.folderName}
            onBack={handleBackToHome}
          />
        )}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;