import React, { useState } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';
import { toast } from '../shared/components/Toast';

export const Login: React.FC = () => {
  const { login, registrar, redefinirSenha, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isRecuperarMode, setIsRecuperarMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erro quando usuário digita
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRecuperarMode) {
      if (!formData.email) {
        setError('Por favor, digite seu e-mail.');
        return;
      }

      try {
        await redefinirSenha(formData.email);
        toast.success(
          `E-mail de redefinição enviado!\n\n` +
          `📧 Verifique a caixa de entrada do e-mail: ${formData.email} para criar uma nova senha.`
        );
        setIsRecuperarMode(false);
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
      } catch (error: unknown) {
        setError((error as Error).message || 'Erro ao enviar e-mail de redefinição.');
      }
      return;
    }

    // Validações básicas
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!isLoginMode && formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        const user = await registrar(formData.email, formData.password);
        // Mostrar mensagem de sucesso após registro
        toast.success(
          `Conta criada com sucesso!\n\n` +
          `📧 Email: ${user.email}\n` +
          `⏳ Status: Aguardando aprovação\n\n` +
          `O administrador foi notificado e você receberá acesso em breve.`
        );
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Erro inesperado. Tente novamente.');
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setIsRecuperarMode(false);
    setError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: 'var(--text-main)',
            fontSize: '28px',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            📋 Sistema OS
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '16px',
            margin: 0
          }}>
            {isRecuperarMode
              ? 'Recuperar Senha'
              : (isLoginMode ? 'Entre com sua conta' : 'Crie sua conta')}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={inputStyle}
              placeholder="seu.email@exemplo.com"
              disabled={isLoading}
            />
          </div>

          {/* Senha */}
          {!isRecuperarMode && (
            <div style={{ marginBottom: isLoginMode ? '10px' : '20px' }}>
              <label style={labelStyle}>Senha:</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                style={inputStyle}
                placeholder="Sua senha"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Link Esqueceu a Senha (apenas no login) */}
          {isLoginMode && !isRecuperarMode && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsRecuperarMode(true);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* Confirmar Senha (apenas no registro) */}
          {!isLoginMode && !isRecuperarMode && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Confirmar Senha:</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                style={inputStyle}
                placeholder="Confirme sua senha"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#d63031',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #fab1a0'
            }}>
              ❌ {error}
            </div>
          )}

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...buttonStyle,
              backgroundColor: isLoading ? '#95a5a6' : '#2563eb',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              '⏳ Processando...'
            ) : (
              isRecuperarMode
                ? '✉️ Enviar Link'
                : (isLoginMode ? '🚀 Entrar' : '✨ Criar Conta')
            )}
          </button>
        </form>

        {/* Toggle Login/Registro/Recuperação */}
        <div style={{
          textAlign: 'center',
          marginTop: '25px',
          paddingTop: '25px',
          borderTop: '1px solid #eee'
        }}>
          {isRecuperarMode ? (
            <button
              type="button"
              onClick={() => {
                setIsRecuperarMode(false);
                setError('');
              }}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Voltar para o login
            </button>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
                {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              </p>
              <button
                type="button"
                onClick={toggleMode}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isLoginMode ? 'Criar uma conta' : 'Fazer login'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Estilos
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 'bold',
  color: 'var(--text-main)',
  fontSize: '14px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 15px',
  border: '2px solid var(--input-border)',
  borderRadius: '8px',
  fontSize: '16px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  outline: 'none',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--text-main)'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  fontSize: '18px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease',
  outline: 'none'
};
