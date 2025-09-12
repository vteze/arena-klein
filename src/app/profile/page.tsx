'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const { currentUser, updateProfilePhoto } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!currentUser) return null;

  const getInitials = (name: string = '') => {
    const parts = name.split(' ');
    if (parts.length === 1 && parts[0].length > 0) return parts[0].substring(0, 2).toUpperCase();
    return parts.map(p => p[0]).filter(Boolean).join('').toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    try {
      await updateProfilePhoto(file);
      setFile(null);
    } catch (err) {
      console.error('Erro ao atualizar foto:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentUser.photoURL || `https://placehold.co/96x96.png?text=${getInitials(currentUser.name)}`} alt={currentUser.name} />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
              <Button type="submit" disabled={!file || isUploading}>{isUploading ? 'Enviando...' : 'Atualizar Foto'}</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
