import React from 'react';
import { siteConfig } from '../../config/site.config';
import { buildWhatsAppLink } from '../../utils/whatsapp';

interface Props {
  children: React.ReactNode;
  /** Changing this value (e.g. the current page) clears a previous error. */
  resetKey?: string;
}

interface State {
  error: Error | null;
  resetKey?: string;
}

/** Catches rendering crashes so one broken page never blanks the whole site. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    // A new deployment replaced the code-split files this tab was using: a reload fixes it.
    const isStaleChunk = /dynamically imported module|Importing a module script failed|Loading chunk/i.test(
      this.state.error.message
    );

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6" role="alert">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">🥀</div>
          <h2 className="font-serif text-2xl font-bold text-[#3D272A]">
            {isStaleChunk ? 'BloomCraft was just updated' : 'Something went wrong on this page'}
          </h2>
          <p className="text-sm text-[#7A5B62]">
            {isStaleChunk
              ? 'Reload to get the newest version — your cart is saved.'
              : 'Your cart is safe. Try reloading, or message us on WhatsApp if it keeps happening.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#D96B82] text-white text-sm font-semibold hover:bg-[#C0536A]"
            >
              Reload page
            </button>
            {!isStaleChunk && (
              <a
                href={buildWhatsAppLink(`Hi ${siteConfig.name}! The website showed an error.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-white border border-[#EBD8DC] text-sm font-semibold text-[#3D272A] hover:bg-[#FFE3E8]"
              >
                WhatsApp us
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
}
