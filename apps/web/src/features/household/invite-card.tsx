import { Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface InviteCardProps {
  inviteCode: string;
  onNewCode: () => void;
  pending?: boolean;
}

/** The code others enter to join this household. */
export function InviteCard({ inviteCode, onNewCode, pending = false }: InviteCardProps) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Share this code with the people you live with. They sign in with their own account and enter
        it on this page to join.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <code
          aria-label="Your invite code"
          className="rounded-xl bg-muted px-4 py-2.5 font-mono text-xl font-semibold tracking-[0.2em]"
        >
          {inviteCode}
        </code>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(inviteCode).then(() => setCopied(true));
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={onNewCode}>
          <RefreshCw aria-hidden /> New code
        </Button>
      </div>
    </div>
  );
}
