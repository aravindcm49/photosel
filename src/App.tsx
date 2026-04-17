import { useState, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { HomeScreen } from '@/screens/HomeScreen';
import { PhotoReviewScreen } from '@/screens/PhotoReviewScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import { ResumeDialog } from '@/components/ResumeDialog';
import type { Project } from '@/types';

type Screen = 'home' | 'review' | 'summary';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [shouldResume, setShouldResume] = useState(false);
  const [pendingResumeProject, setPendingResumeProject] = useState<Project | null>(null);
  const [resumePosition, setResumePosition] = useState<number>(0);

  const handleOpenProject = useCallback((project: Project) => {
    setCurrentProject(project);
    setScreen('review');
  }, []);

  const handleResumeProject = useCallback((project: Project) => {
    // Check if there's saved progress to resume
    const lvp = project.lastVisitedPhoto;
    const activeFilter = project.lastActiveFilter ?? 'all';
    const savedPhoto = lvp?.[activeFilter];

    if (savedPhoto && Object.keys(project.photos).includes(savedPhoto)) {
      // Find the position in the active filter to show in the dialog
      const names = activeFilter === 'all'
        ? Object.keys(project.photos).sort()
        : Object.keys(project.photos).sort().filter(n => project.photos[n].status === activeFilter);
      const position = names.indexOf(savedPhoto) + 1;
      if (position > 0) {
        setPendingResumeProject(project);
        setResumePosition(position);
        return;
      }
    }
    // No saved progress — just open normally
    setCurrentProject(project);
    setShouldResume(false);
    setScreen('review');
  }, []);

  const handleResumeYes = useCallback(() => {
    if (pendingResumeProject) {
      setCurrentProject(pendingResumeProject);
      setShouldResume(true);
      setPendingResumeProject(null);
      setScreen('review');
    }
  }, [pendingResumeProject]);

  const handleResumeNo = useCallback(() => {
    if (pendingResumeProject) {
      setCurrentProject(pendingResumeProject);
      setShouldResume(false);
      setPendingResumeProject(null);
      setScreen('review');
    }
  }, [pendingResumeProject]);

  const handleBackToHome = useCallback(() => {
    setCurrentProject(null);
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
            onBack={handleBackToHome}
            onComplete={handleComplete}
            shouldResume={shouldResume}
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

      {/* Resume dialog */}
      {pendingResumeProject && (
        <ResumeDialog
          photoPosition={resumePosition}
          onYes={handleResumeYes}
          onNo={handleResumeNo}
        />
      )}
    </TooltipProvider>
  );
}

export default App;
