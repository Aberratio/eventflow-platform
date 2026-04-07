import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { UserRole } from '@/types';

export interface MockCredential {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  icon: React.ElementType;
  color: string;
}

interface MockCredentialCardProps {
  credential: MockCredential;
  copiedField: string | null;
  onFill: (cred: MockCredential) => void;
  onCopy: (text: string, fieldId: string) => void;
}

export const MockCredentialCard = ({ credential, copiedField, onFill, onCopy }: MockCredentialCardProps) => {
  const Icon = credential.icon;

  return (
    <Card
      className={`border ${credential.color} cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5`}
      onClick={() => onFill(credential)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{credential.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-background/80 px-2 py-0.5 rounded font-mono truncate">
                {credential.email}
              </code>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCopy(credential.email, `${credential.role}-email`); }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {copiedField === `${credential.role}-email` ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-background/80 px-2 py-0.5 rounded font-mono">
                demo1234
              </code>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCopy('demo1234', `${credential.role}-pass`); }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {copiedField === `${credential.role}-pass` ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="shrink-0 text-xs">
            Użyj
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
