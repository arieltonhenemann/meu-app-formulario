import React, { useState, useEffect } from 'react';
import { EmergencyAdminButton } from './EmergencyAdminButton';
import { userService } from '../shared/services/userService';

interface ConditionalEmergencyButtonProps {
  isAdmin: boolean;
}

export const ConditionalEmergencyButton: React.FC<ConditionalEmergencyButtonProps> = ({ 
  isAdmin 
}) => {
  const [hasAdmins, setHasAdmins] = useState<boolean>(true); // Assumir que há admins por padrão
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const verificarSeHaAdmins = async () => {
      try {
        setChecking(true);
        const existemAdmins = await userService.verificarSeHaAdministradores();
        setHasAdmins(existemAdmins);
        console.log('🔍 Verificação de administradores:', {
          existemAdmins,
          isAdmin,
          shouldShow: !isAdmin && !existemAdmins
        });
      } catch (error) {
        console.error('Erro ao verificar administradores:', error);
        // Em caso de erro, assumir que há admins (mais seguro)
        setHasAdmins(true);
      } finally {
        setChecking(false);
      }
    };

    verificarSeHaAdmins();
  }, [isAdmin]);

  // Não mostrar enquanto está verificando
  if (checking) {
    return null;
  }

  // Só mostrar o botão se:
  // 1. O usuário não é admin
  // 2. E não há administradores no sistema
  const shouldShowButton = !isAdmin && !hasAdmins;

  if (!shouldShowButton) {
    return null;
  }

  return <EmergencyAdminButton />;
};
