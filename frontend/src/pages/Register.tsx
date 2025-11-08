import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">🎄</div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
            Christmas
            <br />
            Wishlist
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-base">Share your gift desires with loved ones</p>
        </div>

        {/* Card */}
        <div className="card card-lg shadow-xl border-2 border-neutral-200 dark:border-neutral-700 animate-slide-up">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">Create Account</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">Join us to start creating wishlists</p>

          {error && (
            <div className="alert alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Registration Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">At least 8 characters recommended</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="divider my-6"></div>

          <p className="text-center text-neutral-700 dark:text-neutral-300">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6">
          ✨ It takes 30 seconds to get started
        </p>
      </div>
    </div>
  );
};

