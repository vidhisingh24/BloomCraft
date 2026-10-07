import React, { useState } from 'react';
import { WelcomeRoleSelection } from './WelcomeRoleSelection';
import { CustomerLoginPage } from './CustomerLoginPage';
import { MakerLoginPage } from './MakerLoginPage';

export type AuthView = 'welcome' | 'customer-login' | 'maker-login';

interface AuthExperienceProps {
  initialView?: AuthView;
  onCustomerLoginSuccess: () => void;
  onMakerLoginSuccess: () => void;
  onExploreStore: () => void;
}

export const AuthExperience: React.FC<AuthExperienceProps> = ({
  initialView = 'welcome',
  onCustomerLoginSuccess,
  onMakerLoginSuccess,
  onExploreStore,
}) => {
  const [view, setView] = useState<AuthView>(initialView);

  return (
    <div className="w-full min-h-screen">
      {view === 'welcome' && (
        <WelcomeRoleSelection
          onSelectCustomer={() => setView('customer-login')}
          onSelectMaker={() => setView('maker-login')}
          onExploreAsGuest={onExploreStore}
        />
      )}

      {view === 'customer-login' && (
        <CustomerLoginPage
          onLoginSuccess={onCustomerLoginSuccess}
          onBackToWelcome={() => setView('welcome')}
          onExploreStore={onExploreStore}
        />
      )}

      {view === 'maker-login' && (
        <MakerLoginPage
          onLoginSuccess={onMakerLoginSuccess}
          onBackToWelcome={() => setView('welcome')}
        />
      )}
    </div>
  );
};

export default AuthExperience;
