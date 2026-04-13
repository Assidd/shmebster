import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    authApi.confirmEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="text-center">
      {status === 'loading' && <p className="text-gray-500">Confirming your email...</p>}
      {status === 'success' && (
        <>
          <p className="text-green-500 font-semibold">Email confirmed successfully!</p>
          <Link to="/login" className="text-indigo-600 hover:underline mt-4 block">Go to Login</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-red-500 font-semibold">Invalid or expired confirmation link.</p>
          <Link to="/login" className="text-indigo-600 hover:underline mt-4 block">Go to Login</Link>
        </>
      )}
    </div>
  );
}
