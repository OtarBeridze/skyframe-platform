import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const loginInput = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const ok = login(loginInput, password);
    if (ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(true);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">SKYFRAME</div>
        <div className="login-sub">Order Management &amp; Quoting</div>

        {error && (
          <div className="login-error">Invalid login or password.</div>
        )}

        <div className="form-group">
          <label htmlFor="username">Login</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="off"
            autoFocus
            onChange={() => setError(false)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="off"
            onChange={() => setError(false)}
          />
        </div>

        <button type="submit" className="btn-login">Sign In</button>

        <div className="login-hint">
          <strong>Demo accounts</strong><br />
          Developer / Developer &nbsp;·&nbsp; Admin / Admin &nbsp;·&nbsp; Sales / Sales
        </div>
      </form>
    </div>
  );
}
