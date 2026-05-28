'use client';

import { useState, useEffect } from 'react';
import { useCaseDiagram, deploymentDiagram, layersOverviewDiagram, classDiagram } from '@/data/diagrams';

interface StaticViewProps {
  selectedFile: string | null;
  syncEnabled: boolean;
}

export default function StaticView({ selectedFile, syncEnabled }: StaticViewProps) {
  const [activeTab, setActiveTab] = useState<'usecase' | 'deployment' | 'layers' | 'class'>('usecase');
  const [mermaidRendered, setMermaidRendered] = useState(false);
  const [diagramKey, setDiagramKey] = useState(0);

  useEffect(() => {
    // Dynamically load and render Mermaid (client-side only)
    const renderMermaid = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#1e293b',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#475569',
            lineColor: '#64748b',
            secondaryColor: '#334155',
            tertiaryColor: '#0f172a',
            background: '#0f172a',
            mainBkg: '#1e293b',
            textColor: '#e2e8f0',
          },
        });
        
        // Remove any existing SVG to force clean render
        const mermaidDiv = document.querySelector('.mermaid');
        if (mermaidDiv) {
          const existingSvg = mermaidDiv.querySelector('svg');
          if (existingSvg) {
            existingSvg.remove();
          }
        }
        
        // Find all mermaid elements and render them
        const elements = document.querySelectorAll('.mermaid');
        if (elements.length > 0) {
          await mermaid.run({
            querySelector: '.mermaid',
          });
          setMermaidRendered(true);
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
      }
    };

    if (activeTab === 'usecase' || activeTab === 'deployment' || activeTab === 'layers' || activeTab === 'class') {
      setMermaidRendered(false);
      setDiagramKey(prev => prev + 1); // Force remount
      setTimeout(renderMermaid, 200);
    }
  }, [activeTab]);

  // Handle diagram click for drill-down navigation
  useEffect(() => {
    const handleDiagramClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mermaidDiv = target.closest('.mermaid');
      
      if (mermaidDiv) {
        // Deployment → Package
        if (activeTab === 'deployment') {
          setActiveTab('layers');
        }
        // Package → Class
        else if (activeTab === 'layers') {
          setActiveTab('class');
        }
      }
    };

    document.addEventListener('click', handleDiagramClick);
    return () => document.removeEventListener('click', handleDiagramClick);
  }, [activeTab]);

  const diagram = activeTab === 'deployment' ? deploymentDiagram : activeTab === 'layers' ? layersOverviewDiagram : activeTab === 'class' ? classDiagram : useCaseDiagram;
  const { changesSummary } = diagram;

  return (
    <div className="flex-1 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Header with Tabs */}
      <div className="h-12 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="text-white font-semibold">Structure View</h2>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('usecase')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'usecase'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Use Cases
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'deployment'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Deployment
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'layers'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Package
          </button>
          <button
            onClick={() => setActiveTab('class')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'class'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Class
          </button>
        </div>
      </div>

      {/* Change Summary Bar */}
      {(activeTab === 'usecase' || activeTab === 'deployment' || activeTab === 'layers' || activeTab === 'class') && (
        <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">Changes:</span>
            <div className="flex items-center gap-1">
              <span className="text-green-500 font-semibold">+{changesSummary.added}</span>
              <span className="text-slate-500">added</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 font-semibold">~{changesSummary.modified}</span>
              <span className="text-slate-500">modified</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">{changesSummary.unchanged}</span>
              <span className="text-slate-500">unchanged</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {changesSummary.added + changesSummary.modified + changesSummary.deleted} {activeTab === 'deployment' ? 'components' : activeTab === 'layers' ? 'packages' : activeTab === 'class' ? 'classes' : 'use cases'} affected
          </div>
        </div>
      )}

      {/* Main Diagram Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'usecase' || activeTab === 'deployment' || activeTab === 'layers' || activeTab === 'class' ? (
          <div className="w-full h-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">{diagram.title}</h3>
              <p className="text-sm text-slate-400">{diagram.description}</p>
            </div>
            
            <div className="relative bg-slate-800/30 rounded-lg p-8 min-h-[calc(100vh-300px)]">
              {/* Loading Overlay */}
              {!mermaidRendered && (
                <div className="absolute inset-0 bg-slate-800/30 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 text-sm">Rendering diagram...</p>
                  </div>
                </div>
              )}
              
              {/* Mermaid Diagram - Hidden until rendered */}
              <div 
                key={diagramKey} 
                className={`mermaid ${(activeTab === 'deployment' || activeTab === 'layers') ? 'cursor-pointer hover:opacity-90' : ''}`}
                title={activeTab === 'deployment' ? 'Click to view Package diagram' : activeTab === 'layers' ? 'Click to view Class diagram' : ''}
                style={{
                  opacity: mermaidRendered ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  color: 'transparent',
                  overflow: 'hidden'
                }}
              >
                {diagram.mermaidCode}
              </div>
              
              {/* CSS to hide text content */}
              <style jsx>{`
                .mermaid {
                  font-size: 0;
                  line-height: 0;
                }
                .mermaid svg {
                  font-size: 16px;
                  line-height: 1.5;
                }
              `}</style>
            </div>
            
            <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {activeTab === 'layers' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-slate-300">Added (New component)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified (Changed)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-400"></div>
                      <span className="text-slate-300">Unchanged (Existing)</span>
                    </div>
                  </>
                ) : activeTab === 'class' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-slate-300">Added (New class)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified (Changed class)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-400"></div>
                      <span className="text-slate-300">Unchanged (Existing class)</span>
                    </div>
                  </>
                ) : activeTab === 'deployment' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified Component</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-slate-300">Unchanged Component</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-500"></div>
                      <span className="text-slate-300">External Service</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-slate-300">Added (New functionality)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified (Enhanced)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-400"></div>
                      <span className="text-slate-300">Unchanged (Existing)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-slate-300">Actor (User/System)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700">
                <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-slate-300 font-medium mb-2">Component Diagrams</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Component diagrams showing code structure coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="h-12 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <button className="px-2 py-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white text-xs transition-colors">
            Fit
          </button>
          <button className="px-2 py-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white text-xs transition-colors">
            Reset
          </button>
        </div>

        <div className="text-xs text-slate-500">
          {syncEnabled && <span className="text-green-500">● Synced</span>}
        </div>
      </div>
    </div>
  );
}
