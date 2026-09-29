'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { register, registerLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Email không hợp lệ');
      return;
    }

    if (!name.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }

    try {
      await register({ name, email, password });
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="bg-netflix-card p-8 rounded-lg shadow-xl">
      <div className="text-center mb-8">
        <Link href="/" className="text-netflix-red text-3xl font-bold">CINESTREAM</Link>
        <h1 className="text-2xl font-bold text-white mt-4">Đăng ký</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-netflix-text-secondary">Họ tên</Label>
          <Input id="name" type="text" placeholder="Nguyễn Văn A" value={name}
            onChange={(e) => setName(e.target.value)} required
            className="bg-netflix-dark border-netflix-hover text-white placeholder:text-netflix-text-muted focus:border-netflix-red" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-netflix-text-secondary">Email</Label>
          <Input id="email" type="email" placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="bg-netflix-dark border-netflix-hover text-white placeholder:text-netflix-text-muted focus:border-netflix-red" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-netflix-text-secondary">Mật khẩu</Label>
          <Input id="password" type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className="bg-netflix-dark border-netflix-hover text-white placeholder:text-netflix-text-muted focus:border-netflix-red" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-netflix-text-secondary">Xác nhận mật khẩu</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required
            className="bg-netflix-dark border-netflix-hover text-white placeholder:text-netflix-text-muted focus:border-netflix-red" />
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full bg-netflix-red hover:bg-netflix-red-hover text-white" disabled={registerLoading}>
          {registerLoading ? 'Đang đăng ký...' : 'Đăng ký'}
        </Button>
      </form>
      <p className="text-center text-netflix-text-secondary text-sm mt-6">
        Đã có tài khoản? <Link href="/login" className="text-netflix-red hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}
