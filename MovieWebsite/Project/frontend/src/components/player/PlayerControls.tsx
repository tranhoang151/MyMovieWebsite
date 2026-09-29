'use client';

import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onChangeVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  isPlaying, currentTime, duration, volume, isMuted,
  onTogglePlay, onSeek, onChangeVolume, onToggleMute, onToggleFullscreen,
}: PlayerControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Progress bar */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-netflix-red mb-3"
      />

      <div className="flex items-center justify-between text-white text-sm">
        <div className="flex items-center gap-4">
          <button onClick={onTogglePlay} className="hover:text-netflix-red transition-colors">
            {isPlaying ? <Pause size={20} /> : <Play size={20} fill="white" />}
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onToggleMute} className="hover:text-netflix-red transition-colors">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-netflix-red"
            />
          </div>

          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        <button onClick={onToggleFullscreen} className="hover:text-netflix-red transition-colors">
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
}