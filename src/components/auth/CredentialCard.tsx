import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { UserRole } from '@/types';

export interface QuickLoginCredential {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  icon: React.ElementType;
  color: string;
}

interface CredentialCardProps {
  credential: QuickLoginCredential;
  copiedField: string | null;
  isLoading?: boolean;
  onLogin: (cred: QuickLoginCredential) => void;
  onCopy: (text: string, fieldId: string) => void;
}

export const CredentialCard = ({
  credential,
  copiedField,
  isLoading = false,
  onLogin,
  onCopy,
}: CredentialCardProps) => {
  const Icon = credential.icon;

  return (
    <Card
      className={`border ${credential.color} cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md`}
      onClick={() => {
        if (!isLoading) onLogin(credential);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{credential.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="truncate rounded bg-background/80 px-2 py-0.5 font-mono text-xs">
                {credential.email}
              </code>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCopy(credential.email, `${credential.role}-email`);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {copiedField === `${credential.role}-email` ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded bg-background/80 px-2 py-0.5 font-mono text-xs">
                {credential.password}
              </code>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCopy(credential.password, `${credential.role}-pass`);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {copiedField === `${credential.role}-pass` ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="shrink-0 text-xs" disabled={isLoading}>
            {isLoading ? '...' : 'Zaloguj'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
