import React from 'react';
import { EmergencyAdminButton } from './EmergencyAdminButton';
import { useAuth } from '../shared/contexts/AuthContext';

export const ConditionalEmergencyButton: React.FC = () => {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return null;
  }

  return <EmergencyAdminButton />;
};
