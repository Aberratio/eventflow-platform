import React, { useState } from 'react';
import { SeedEventDialog } from './SeedEventDialog';

const DEV_ONLY = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export function DevToolbox() {
  const [open, setOpen] = useState(false);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);

  if (!DEV_ONLY) return null;

  const tools: Tool[] = [
    {
      id: 'seed-event',
      label: 'Generuj przeszłe wydarzenie',
      description: 'Tworzy losowe wydarzenie z uczestnikami i wynikami',
      icon: '🎲',
      onClick: () => {
        setSeedDialogOpen(true);
        setOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-2">
        {/* Panel */}
        {open && (
          <div className="bg-background border border-border rounded-xl shadow-2xl w-72 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-base">🛠</span>
                <span className="text-sm font-semibold">Przybornik dewelopera</span>
              </div>
              <span className="text-xs font-mono bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-700">
                DEV
              </span>
            </div>

            <div className="p-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={tool.onClick}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                >
                  <span className="text-lg mt-0.5 shrink-0">{tool.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">
                      {tool.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {tool.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Widoczne tylko w trybie developerskim
              </p>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={open ? 'Zamknij przybornik' : 'Otwórz przybornik dewelopera'}
          className={`
            w-12 h-12 rounded-full shadow-lg border-2 flex items-center justify-center
            transition-all duration-200 select-none
            ${open
              ? 'bg-amber-500 border-amber-600 hover:bg-amber-600 rotate-45'
              : 'bg-background border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }
          `}
        >
          <span className={`text-xl transition-transform duration-200 ${open ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
            {open ? '✕' : '🛠'}
          </span>
        </button>
      </div>

      {/* Dialogs */}
      <SeedEventDialog
        open={seedDialogOpen}
        onClose={() => setSeedDialogOpen(false)}
      />
    </>
  );
}
