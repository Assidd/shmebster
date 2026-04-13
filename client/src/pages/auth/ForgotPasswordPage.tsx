import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-gray-500 text-sm">If an account exists with {email}, we sent a password reset link.</p>
        <Link to="/login" className="text-indigo-600 hover:underline block">Back to Login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Forgot Password</h2>
      <p className="text-sm text-gray-500 text-center">Enter your email to receive a reset link.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      <Link to="/login" className="text-indigo-600 hover:underline text-sm text-center block">Back to Login</Link>
    </form>
  );
}
