import React, { useState } from 'react';

function LoginScreen({ onLogin }) {
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUser === 'Admin' && loginPassword === 'Admin') {
      onLogin(true);
      setLoginError('');
    } else {
      setLoginError('❌ Usuario o contraseña incorrectos');
      setLoginUser('');
      setLoginPassword('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <span className="login-icon">🏪</span>
          <h2>Pulpería Violeta</h2>
          <p>Ingrese sus credenciales</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>👤 Usuario</label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="input-group">
            <label>🔒 Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>
          {loginError && <div className="login-error">{loginError}</div>}
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
        </form>
        <div className="login-footer">
        
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;