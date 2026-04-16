import type { Project } from '@/types';

export function generateSelectedContent(project: Project): string {
  return Object.values(project.photos)
    .filter((p) => p.status === 'selected')
    .map((p) => p.filename)
    .sort()
    .join('\n');
}

export function generateSkippedContent(project: Project): string {
  return Object.values(project.photos)
    .filter((p) => p.status === 'skipped')
    .map((p) => p.filename)
    .sort()
    .join('\n');
}

export function generateSelectedWithTagsContent(project: Project): string {
  const selected = Object.values(project.photos)
    .filter((p) => p.status === 'selected')
    .sort((a, b) => a.filename.localeCompare(b.filename));

  return selected
    .map((p) => {
      if (p.people.length > 0) {
        return `${p.filename} - ${p.people.join(', ')}`;
      }
      return p.filename;
    })
    .join('\n');
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportProject(project: Project): void {
  const selectedContent = generateSelectedContent(project);
  const skippedContent = generateSkippedContent(project);

  downloadFile(selectedContent, 'Selected.txt');
  downloadFile(skippedContent, 'Skipped.txt');
}
