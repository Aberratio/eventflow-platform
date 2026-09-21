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
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
        {/* Panel */}
        {open && (
          <div className="w-72 overflow-hidden rounded-xl border border-border bg-background shadow-2xl duration-150 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🛠</span>
                <span className="text-sm font-semibold">Przybornik dewelopera</span>
              </div>
              <span className="rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                DEV
              </span>
            </div>

            <div className="p-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={tool.onClick}
                  className="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <span className="mt-0.5 shrink-0 text-lg">{tool.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium transition-colors group-hover:text-primary">
                      {tool.label}
                    </div>
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {tool.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t bg-muted/20 px-4 py-2.5">
              <p className="text-xs text-muted-foreground">Widoczne tylko w trybie developerskim</p>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={open ? 'Zamknij przybornik' : 'Otwórz przybornik dewelopera'}
          className={`flex h-12 w-12 select-none items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 ${
            open
              ? 'rotate-45 border-amber-600 bg-amber-500 hover:bg-amber-600'
              : 'border-amber-400 bg-background hover:bg-amber-50 dark:hover:bg-amber-900/20'
          } `}
        >
          <span
            className={`text-xl transition-transform duration-200 ${open ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}
          >
            {open ? '✕' : '🛠'}
          </span>
        </button>
      </div>

      {/* Dialogs */}
      <SeedEventDialog open={seedDialogOpen} onClose={() => setSeedDialogOpen(false)} />
    </>
  );
}
