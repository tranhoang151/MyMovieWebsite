'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import PlayerControls from './PlayerControls';
import { RotateCcw, X } from 'lucide-react';

interface VideoPlayerProps {
  m3u8Url?: string | null;
  embedUrl?: string | null;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const formatTime = (secs: number) => {
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function VideoPlayer({ m3u8Url, embedUrl, initialTime, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [useIframe, setUseIframe] = useState(!m3u8Url && !!embedUrl);
  const [error, setError] = useState<string | null>(null);
  const [showResumeToast, setShowResumeToast] = useState(!!initialTime && initialTime > 5);

  const hasSeekedRef = useRef(false);

  useEffect(() => {
    hasSeekedRef.current = false;
    if (initialTime && initialTime > 5) {
      setShowResumeToast(true);
      const timer = setTimeout(() => setShowResumeToast(false), 6000);
      return () => clearTimeout(timer);
    } else {
      setShowResumeToast(false);
    }
  }, [m3u8Url, embedUrl, initialTime]);

  const performInitialSeek = () => {
    const video = videoRef.current;
    if (!video || hasSeekedRef.current || !initialTime || initialTime <= 0) return;
    if (!video.duration || initialTime < video.duration) {
      video.currentTime = initialTime;
      setCurrentTime(initialTime);
      hasSeekedRef.current = true;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useIframe) return;

    if (m3u8Url) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          performInitialSeek();
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (embedUrl) setUseIframe(true);
            else setError('Lỗi phát video');
          }
        });
        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = m3u8Url;
      } else if (embedUrl) {
        setUseIframe(true);
      } else {
        setError('Trình duyệt không hỗ trợ phát video này');
      }
    } else if (embedUrl) {
      setUseIframe(true);
    }
  }, [m3u8Url, embedUrl, useIframe]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useIframe) return;
    const onTime = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };
    const onMeta = () => {
      setDuration(video.duration);
      performInitialSeek();
    };
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onMeta);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('loadedmetadata', onMeta);
    };
  }, [useIframe, onTimeUpdate, initialTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    setIsPlaying(!video.paused);
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRestartFromBeginning = () => {
    seek(0);
    setShowResumeToast(false);
  };

  const changeVolume = (v: number) => {
    if (videoRef.current) {
      videoRef.current.volume = v;
      setVolume(v);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!document.fullscreenElement && container) container.requestFullscreen();
    else document.exitFullscreen();
  };

  if (error) return <div className="w-full aspect-video bg-black flex items-center justify-center text-white">{error}</div>;

  if (useIframe && embedUrl) {
    return (
      <div className="w-full flex flex-col gap-2">
        {initialTime && initialTime > 5 && (
          <div className="bg-red-600/20 border border-red-500/40 text-red-200 text-xs px-3 py-2 rounded flex items-center justify-between">
            <span>
              ▶ Đang tiếp tục xem từ <strong>{formatTime(initialTime)}</strong> (dừng trước đó).
            </span>
          </div>
        )}
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black relative group rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full" playsInline onClick={togglePlay} />

      {/* Resume Toast Banner */}
      {showResumeToast && initialTime && initialTime > 5 && (
        <div className="absolute top-4 right-4 z-20 bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in">
          <span>
            Tiếp tục xem từ <strong>{formatTime(initialTime)}</strong>
          </span>
          <button
            onClick={handleRestartFromBeginning}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-medium px-2 py-1 rounded transition-colors text-xs"
          >
            <RotateCcw size={12} /> Xem từ đầu
          </button>
          <button
            onClick={() => setShowResumeToast(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <PlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onChangeVolume={changeVolume}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
