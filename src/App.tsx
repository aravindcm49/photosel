import { useState, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { HomeScreen } from '@/screens/HomeScreen';
import { PhotoReviewScreen } from '@/screens/PhotoReviewScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import type { Project } from '@/types';

type Screen = 'home' | 'review' | 'summary';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const handleOpenProject = useCallback((project: Project, handle: FileSystemDirectoryHandle) => {
    setCurrentProject(project);
    setDirHandle(handle);
    setScreen('review');
  }, []);

  const handleResumeProject = useCallback((project: Project, handle: FileSystemDirectoryHandle) => {
    setCurrentProject(project);
    setDirHandle(handle);
    setScreen('review');
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentProject(null);
    setDirHandle(null);
    setScreen('home');
  }, []);

  const handleComplete = useCallback((project: Project) => {
    setCurrentProject(project);
    setScreen('summary');
  }, []);

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
            project={currentProject}
            dirHandle={dirHandle}
            onBack={handleBackToHome}
            onComplete={handleComplete}
          />
        )}
        {screen === 'summary' && currentProject && (
          <SummaryScreen
            project={currentProject}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;