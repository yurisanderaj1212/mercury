'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const registerSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido'),
});

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: 'Este correo ya está registrado',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  INVALID_EMAIL_FORMAT: 'Formato de correo inválido',
};

export default function RegisterPage(): React.React.JSX.Element {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Error de validación');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{
        user: { id: string; email: string; fullName: string; role: string; status: string };
        token: { accessToken: string };
      }>('/auth/register', form);

      if (res.data) {
        setAuth(res.data.user, res.data.token.accessToken);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(ERROR_MESSAGES[err.message] ?? err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo</label>
            <input
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Juan García"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-600 font-medium">Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
