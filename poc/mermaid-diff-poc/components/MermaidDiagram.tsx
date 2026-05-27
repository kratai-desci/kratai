'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  onMethodClick?: (methodName: string) => void;
  onElementClick?: (elementId: string) => void;
}

export default function MermaidDiagram({ chart, className = '', onMethodClick, onElementClick }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose', // Required for click events
    });

    // Register global click handler for C4 diagrams
    if (onElementClick) {
      (window as any).handleElementClick = (elementId: string) => {
        console.log('Global handler called with:', elementId);
        onElementClick(elementId);
      };
    }

    // Render the diagram
    const renderDiagram = async () => {
      try {
        // Clear previous SVG and show loading
        setSvg('');
        setIsLoading(true);
        
        // Generate unique ID for each render
        const uniqueId = `${diagramId}-${Date.now()}`;
        
        const { svg } = await mermaid.render(uniqueId, chart);
        setSvg(svg);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setIsLoading(false);
      }
    };

    renderDiagram();

    // Cleanup global handler on unmount
    return () => {
      if (onElementClick) {
        delete (window as any).handleElementClick;
      }
    };
  }, [chart, diagramId, onElementClick]);

  // Add click handlers after SVG is rendered for C4 diagrams
  useEffect(() => {
    if (!svg || !containerRef.current || !onElementClick) {
      return;
    }

    const attemptSetup = (attempt = 1) => {
      const svgElement = containerRef.current?.querySelector('svg');
      
      if (!svgElement) {
        if (attempt < 5) {
          setTimeout(() => attemptSetup(attempt + 1), 200);
        }
        return;
      }

      console.log('Setting up C4 click handlers...');
      console.log('SVG HTML:', svgElement.innerHTML.substring(0, 500));

      // Find all clickable elements in C4 diagrams
      // C4 elements are typically in groups with class names containing the element type
      const allGroups = svgElement.querySelectorAll('g');
      console.log('Total groups found:', allGroups.length);
      
      let clickableCount = 0;
      allGroups.forEach((group) => {
        // Look for groups that contain rectangles (boxes in C4)
        const rect = group.querySelector('rect');
        const texts = group.querySelectorAll('text');
        
        // Skip if no rect
        if (!rect || texts.length === 0) return;
        
        // Get all text content and find the main label (usually the first non-technical text)
        let mainText = '';
        for (const text of Array.from(texts)) {
          const content = text.textContent?.trim() || '';
          // Skip empty, technical labels, or descriptions in parentheses
          if (content.length < 2) continue;
          if (content.startsWith('<<') || content.startsWith('(') || content.startsWith('[')) continue;
          // The main label is usually not all lowercase and not too long
          if (content.length > 2 && content.length < 50) {
            mainText = content;
            break; // Use the first valid text we find
          }
        }
        
        // Skip if we didn't find valid text
        if (!mainText) return;
        
        console.log('Making clickable:', mainText);
        clickableCount++;
        
        // Make the entire group clickable
        group.style.cursor = 'pointer';
        group.style.transition = 'opacity 0.2s';
        
        // Add hover effect to the rectangle
        group.addEventListener('mouseenter', () => {
          rect.style.opacity = '0.7';
          rect.style.filter = 'brightness(1.1)';
        });
        
        group.addEventListener('mouseleave', () => {
          rect.style.opacity = '1';
          rect.style.filter = 'brightness(1)';
        });
        
        // Add click handler - pass TEXT CONTENT
        const clickHandler = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('🖱️ C4 Element clicked - Text:', mainText);
          onElementClick(mainText);
        };
        
        group.addEventListener('click', clickHandler);
      });
      
      console.log('Total clickable C4 elements:', clickableCount);
    };

    setTimeout(() => attemptSetup(), 300);
  }, [svg, onElementClick]);

  // Add click handlers for method clicks in class diagrams
  useEffect(() => {
    if (!svg || !containerRef.current || !onMethodClick) {
      return;
    }

    // Use longer delay and check multiple times
    const attemptSetup = (attempt = 1) => {
      console.log(`Attempt ${attempt}: Setting up click handlers...`);
      console.log('Container:', containerRef.current);
      console.log('Container children:', containerRef.current?.children.length);
      
      // Query for text elements within the SVG
      const svgElement = containerRef.current?.querySelector('svg');
      console.log('SVG element found:', !!svgElement);
      
      if (!svgElement) {
        if (attempt < 5) {
          console.log('SVG not found yet, retrying...');
          setTimeout(() => attemptSetup(attempt + 1), 200);
        } else {
          console.log('Failed to find SVG after 5 attempts');
        }
        return;
      }
      
      // Look for text in both SVG text elements and HTML spans
      const textElements = svgElement.querySelectorAll('text');
      const spanElements = svgElement.querySelectorAll('span');
      const allTextElements = [...Array.from(textElements), ...Array.from(spanElements)];
      
      console.log('Found text elements:', textElements.length);
      console.log('Found span elements:', spanElements.length);
      console.log('Total text-like elements:', allTextElements.length);
      
      if (allTextElements.length === 0 && attempt < 5) {
        console.log('No text elements yet, retrying...');
        setTimeout(() => attemptSetup(attempt + 1), 200);
        return;
      }
      
      let methodCount = 0;
      allTextElements.forEach((el, index) => {
        const text = el.textContent?.trim() || '';
        if (index < 30) console.log(`Text ${index}:`, text); // Log first 30
        
        // Check if it looks like a method (contains parentheses)
        if (text.includes('(') && text.includes(')')) {
          methodCount++;
          console.log('Found method:', text);
          
          // Make it visually clickable (works for both SVG text and HTML spans)
          el.style.cursor = 'pointer';
          el.style.fill = '#2563eb'; // for SVG text
          el.style.color = '#2563eb'; // for HTML spans
          el.style.textDecoration = 'underline';
          el.style.fontWeight = '600';
          
          // Add hover effect
          el.addEventListener('mouseenter', () => {
            el.style.fill = '#1d4ed8'; // darker blue for SVG
            el.style.color = '#1d4ed8'; // darker blue for HTML
          });
          
          el.addEventListener('mouseleave', () => {
            el.style.fill = '#2563eb'; // back to normal blue for SVG
            el.style.color = '#2563eb'; // back to normal blue for HTML
          });
          
          const clickHandler = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Method clicked:', text);
            if (onMethodClick) {
              onMethodClick(text);
            }
          };
          
          el.addEventListener('click', clickHandler);
        }
      });
      
      console.log('Total methods made clickable:', methodCount);
    };
    
    // Start the first attempt after a short delay
    const timer = setTimeout(() => attemptSetup(1), 100);
    
    return () => clearTimeout(timer);
  }, [svg, onMethodClick]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-semibold">Error rendering diagram:</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading || !svg) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Loading diagram...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
