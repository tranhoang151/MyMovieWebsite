'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import PlayerControls from './PlayerControls';

interface VideoPlayerProps {
  m3u8Url?: string | null;
  embedUrl?: string | null;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({ m3u8Url, embedUrl, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [useIframe, setUseIframe] = useState(!m3u8Url && !!embedUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || useIframe) return;

    if (m3u8Url) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (embedUrl) setUseIframe(true);
            else setError('Lỗi phát video');
          }
        });
        return () => { hls.destroy(); hlsRef.current = null; };
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
    const onTime = () => { setCurrentTime(video.currentTime); onTimeUpdate?.(video.currentTime); };
    const onMeta = () => setDuration(video.duration);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onMeta);
    return () => { video.removeEventListener('timeupdate', onTime); video.removeEventListener('loadedmetadata', onMeta); };
  }, [useIframe, onTimeUpdate]);

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

  const seek = (time: number) => { if (videoRef.current) videoRef.current.currentTime = time; };
  const changeVolume = (v: number) => { if (videoRef.current) { videoRef.current.volume = v; setVolume(v); } };
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } };
  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!document.fullscreenElement && container) container.requestFullscreen();
    else document.exitFullscreen();
  };

  if (error) return <div className="w-full aspect-video bg-black flex items-center justify-center text-white">{error}</div>;

  if (useIframe && embedUrl) {
    return (
      <div className="w-full aspect-video bg-black">
        <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black relative group">
      <video ref={videoRef} className="w-full h-full" playsInline onClick={togglePlay} />
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