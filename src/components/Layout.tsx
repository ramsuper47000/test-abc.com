import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export default function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Restored Geopolitical Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[140px]"></div>
        <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] bg-blue-400/5 rounded-full mix-blend-screen filter blur-[100px]"></div>
        
        {/* Subtle Grid for technical feel */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen overflow-x-hidden">
        {sidebar}
        
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 md:p-8 lg:p-10 lg:pl-28 transition-all duration-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
