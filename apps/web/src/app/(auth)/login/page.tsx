'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Error de validación');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{
        user: { id: string; email: string; fullName: string; role: string; status: string };
        token: { accessToken: string };
      }>('/auth/login', { email, password });

      if (res.data) {
        setAuth(res.data.user, res.data.token.accessToken);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message === 'INVALID_CREDENTIALS' ? 'Correo o contraseña incorrectos' : err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Mercury</h1>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-blue-600 font-medium">Regístrate</a>
        </p>
      </div>
    </div>
  );
}
