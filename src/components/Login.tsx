import React, { useState } from 'react';
import { useAuth } from '../shared/contexts/AuthContext';

export const Login: React.FC = () => {
  const { login, registrar, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
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
        await registrar(formData.email, formData.password);
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado. Tente novamente.');
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: '#333',
            fontSize: '28px',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            📋 Sistema OS
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0
          }}>
            {isLoginMode ? 'Entre com sua conta' : 'Crie sua conta'}
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
          <div style={{ marginBottom: '20px' }}>
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

          {/* Confirmar Senha (apenas no registro) */}
          {!isLoginMode && (
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
              backgroundColor: isLoading ? '#95a5a6' : '#6c5ce7',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              '⏳ Processando...'
            ) : (
              isLoginMode ? '🚀 Entrar' : '✨ Criar Conta'
            )}
          </button>
        </form>

        {/* Toggle Login/Registro */}
        <div style={{
          textAlign: 'center',
          marginTop: '25px',
          paddingTop: '25px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#6c5ce7',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLoginMode ? 'Criar uma conta' : 'Fazer login'}
          </button>
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
  color: '#333',
  fontSize: '14px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 15px',
  border: '2px solid #ddd',
  borderRadius: '8px',
  fontSize: '16px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  outline: 'none'
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
