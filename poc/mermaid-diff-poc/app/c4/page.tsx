'use client';

import { useState, useEffect } from 'react';
import MermaidDiagram from '@/components/MermaidDiagram';
import TopNav from '@/components/TopNav';
import { getGitHubService, GitHubRepo } from '@/lib/github';

export default function C4OverviewPage() {
  const [currentLevel, setCurrentLevel] = useState<'context' | 'container' | 'component'>('context');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [diagrams, setDiagrams] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('src');

  useEffect(() => {
    // Check authentication and load repo from localStorage
    const token = localStorage.getItem('github_token');
    const repoData = localStorage.getItem('selected_repo');
    
    if (token) {
      setIsAuthenticated(true);
      getGitHubService().setToken(token);
    }
    
    if (repoData) {
      setSelectedRepo(JSON.parse(repoData));
    }
  }, []);

  // Fetch diagrams when repo is loaded or folder changes
  useEffect(() => {
    if (selectedRepo && isAuthenticated) {
      loadDiagrams();
    }
  }, [selectedRepo, isAuthenticated, selectedFolder]);

  const loadDiagrams = async () => {
    if (!selectedRepo) return;

    setLoading(true);
    const token = localStorage.getItem('github_token');
    
    try {
      // Fetch all three levels
      const [contextRes, containerRes, componentRes] = await Promise.all([
        fetch('/api/c4', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            level: 'context',
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
          }),
        }),
        fetch('/api/c4', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            level: 'container',
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
          }),
        }),
        fetch('/api/c4', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            level: 'component',
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
            folderPath: selectedFolder,
          }),
        }),
      ]);

      const [contextData, containerData, componentData] = await Promise.all([
        contextRes.json(),
        containerRes.json(),
        componentRes.json(),
      ]);

      setDiagrams({
        context: contextData.diagram || getFallbackDiagram('context'),
        container: containerData.diagram || getFallbackDiagram('container'),
        component: componentData.diagram || getFallbackDiagram('component'),
      });

      setMetadata({
        context: contextData.metadata || {},
        container: containerData.metadata || {},
        component: componentData.metadata || {},
      });
    } catch (error) {
      console.error('Failed to load C4 diagrams:', error);
      setDiagrams({
        context: getFallbackDiagram('context'),
        container: getFallbackDiagram('container'),
        component: getFallbackDiagram('component'),
      });
    } finally {
      setLoading(false);
    }
  };

  const getFallbackDiagram = (level: string) => {
    return `C4Context
      title ${level} Diagram
      
      Person(user, "User")
      System(sys, "System")
      
      Rel(user, sys, "Uses")`;
  };

  const handleElementClick = (elementId: string) => {
    console.log('=== CLICK EVENT ===>>');
    console.log('Element clicked:', elementId);
    console.log('Current level:', currentLevel);
    console.log('Selected repo:', selectedRepo?.name);
    console.log('Available metadata:', metadata);
    
    if (currentLevel === 'context') {
      // Context → Container: Click on main system (repo name) goes to container view
      console.log('Context level - checking if', elementId, 'matches repo:', selectedRepo?.name);
      
      // Match if element text is the repo name (case-insensitive)
      if (elementId.toLowerCase() === selectedRepo?.name.toLowerCase()) {
        console.log('✅ MATCH! Navigating to container view');
        setCurrentLevel('container');
      } else {
        console.log('❌ NO MATCH');
        console.log('  Clicked:', elementId.toLowerCase());
        console.log('  Expected:', selectedRepo?.name.toLowerCase());
      }
    } else if (currentLevel === 'container') {
      // Container → Component: Click on a folder name
      const folders = metadata.container?.folders || [];
      
      console.log('Available folders:', folders);
      
      // Check if clicked text matches any folder name
      const matchedFolder = folders.find((f: string) => 
        elementId.toLowerCase() === f.toLowerCase()
      );
      
      if (matchedFolder) {
        console.log('✅ Folder clicked:', matchedFolder);
        setSelectedFolder(matchedFolder);
        setCurrentLevel('component');
      } else {
        console.log('❌ No matching folder - available:', folders);
      }
    } else if (currentLevel === 'component') {
      // Component → Code View: Click on a file name
      const files = metadata.component?.files || [];
      const folderPath = metadata.component?.folderPath || selectedFolder;
      
      console.log('Available files:', files);
      
      // Check if clicked text matches any file name (with or without extension)
      const matchedFile = files.find((f: string) => {
        const fileWithoutExt = f.replace(/\.(ts|tsx|js|jsx)$/, '');
        return elementId.toLowerCase() === f.toLowerCase() ||
               elementId.toLowerCase() === fileWithoutExt.toLowerCase();
      });
      
      if (matchedFile) {
        const filePath = `${folderPath}/${matchedFile}`;
        console.log('✅ File clicked:', matchedFile, '→', filePath);
        window.location.href = `/?file=${encodeURIComponent(filePath)}`;
      } else {
        console.log('❌ No matching file - available:', files);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('selected_repo');
    window.location.href = '/';
  };

  // Show loading state if no diagrams loaded yet
  if (!selectedRepo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <TopNav 
          isAuthenticated={isAuthenticated}
          selectedRepo={selectedRepo}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No repository selected. Go to Code View to select a repository.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Top Navigation */}
      <TopNav 
        isAuthenticated={isAuthenticated}
        selectedRepo={selectedRepo}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            C4 Architecture Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Multi-level architecture visualization using C4 model
          </p>
        </div>

        {/* Level Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setCurrentLevel('context')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentLevel === 'context'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Level 1: Context
          </button>
          <button
            onClick={() => setCurrentLevel('container')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentLevel === 'container'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Level 2: Container
          </button>
          <button
            onClick={() => setCurrentLevel('component')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentLevel === 'component'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Level 3: Component
          </button>
        </div>

        {/* Diagram Display */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                {currentLevel === 'context' && 'System Context Diagram'}
                {currentLevel === 'container' && 'Container Diagram'}
                {currentLevel === 'component' && 'Component Diagram'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {currentLevel === 'context' && `High-level view of ${selectedRepo.name} and its external dependencies`}
                {currentLevel === 'container' && `Major containers (modules) in ${selectedRepo.name}`}
                {currentLevel === 'component' && `Components within the src folder`}
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 min-h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : diagrams[currentLevel] ? (
                <MermaidDiagram 
                  chart={diagrams[currentLevel]}
                  onElementClick={handleElementClick}
                />
              ) : (
                <div className="text-center py-24 text-slate-500 dark:text-slate-400">
                  <p>No diagram available</p>
                </div>
              )}
            </div>

            {/* Navigation hint */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">💡 Interactive Navigation:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Click on boxes/elements to drill down to the next level</li>
                    <li>Context → Container → Component → Code</li>
                    <li>Use the level buttons above to navigate back up</li>
                    {currentLevel === 'component' && <li className="font-medium">🎯 Currently viewing: {selectedFolder}/</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
