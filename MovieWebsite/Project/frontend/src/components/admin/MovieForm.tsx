'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface MovieFormProps {
  initialData?: Partial<{
    name: string;
    originalName: string;
    description: string;
    thumbUrl: string;
    posterUrl: string;
    quality: string;
    language: string;
    director: string;
    casts: string;
    time: string;
    totalEpisodes: number;
    currentEpisode: string;
    year: string;
    status: string;
  }>;
  onSubmit: (data: Record<string, string | number>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function MovieForm({ initialData, onSubmit, onCancel, isLoading }: MovieFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    originalName: initialData?.originalName || '',
    description: initialData?.description || '',
    thumbUrl: initialData?.thumbUrl || '',
    posterUrl: initialData?.posterUrl || '',
    quality: initialData?.quality || '',
    language: initialData?.language || '',
    director: initialData?.director || '',
    casts: initialData?.casts || '',
    time: initialData?.time || '',
    totalEpisodes: initialData?.totalEpisodes || 0,
    currentEpisode: initialData?.currentEpisode || '',
    year: initialData?.year || '',
    status: initialData?.status || '',
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-netflix-text-secondary">Tên phim *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="originalName" className="text-netflix-text-secondary">Tên gốc</Label>
          <Input
            id="originalName"
            value={formData.originalName}
            onChange={(e) => handleChange('originalName', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-netflix-text-secondary">Mô tả</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 bg-netflix-dark border border-netflix-hover rounded-lg text-white resize-y"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="thumbUrl" className="text-netflix-text-secondary">URL Thumbnail</Label>
          <Input
            id="thumbUrl"
            value={formData.thumbUrl}
            onChange={(e) => handleChange('thumbUrl', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="posterUrl" className="text-netflix-text-secondary">URL Poster</Label>
          <Input
            id="posterUrl"
            value={formData.posterUrl}
            onChange={(e) => handleChange('posterUrl', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality" className="text-netflix-text-secondary">Chất lượng</Label>
          <Input
            id="quality"
            value={formData.quality}
            onChange={(e) => handleChange('quality', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
            placeholder="HD, FHD..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language" className="text-netflix-text-secondary">Ngôn ngữ</Label>
          <Input
            id="language"
            value={formData.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
            placeholder="Vietsub, Thuyết Minh..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="director" className="text-netflix-text-secondary">Đạo diễn</Label>
          <Input
            id="director"
            value={formData.director}
            onChange={(e) => handleChange('director', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="casts" className="text-netflix-text-secondary">Diễn viên</Label>
          <Input
            id="casts"
            value={formData.casts}
            onChange={(e) => handleChange('casts', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-netflix-text-secondary">Thời lượng</Label>
          <Input
            id="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
            placeholder="104 phút"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-netflix-text-secondary">Năm</Label>
          <Input
            id="year"
            value={formData.year}
            onChange={(e) => handleChange('year', e.target.value)}
            className="bg-netflix-dark border-netflix-hover text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-netflix-hover text-white hover:bg-netflix-hover"
          >
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="bg-netflix-red hover:bg-netflix-red-hover text-white">
          {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
}
