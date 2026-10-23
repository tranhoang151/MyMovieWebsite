'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMovie, useRecordView } from '@/hooks/useMovies';
import VideoPlayer from '@/components/player/VideoPlayer';
import EpisodeNav from '@/components/player/EpisodeNav';
import EpisodeList from '@/components/movie/EpisodeList';
import ServerSelector from '@/components/player/ServerSelector';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Episode } from '@/types';
import { formatViews } from '@/lib/utils';

function WatchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const ep = params.ep as string;

  const { data: movie, isLoading } = useMovie(slug);
  const { isAuthenticated } = useAuthStore();
  const { history, saveProgress } = useWatchHistory();
  const [currentServer, setCurrentServer] = useState('');

  // Determine initial resume time from URL (?t=...) or user's watch history
  const urlTime = Number(searchParams?.get('t')) || 0;
  const historyEntry = history?.find(
    (h) => (h.movie?.slug === slug || h.movieId === movie?.id) && h.episodeSlug === ep,
  );
  const initialTime = urlTime > 0 ? urlTime : (historyEntry?.progressSec || 0);

  useEffect(() => {
    if (movie?.episodes) {
      const grouped: { [k: string]: Episode[] } = {};
      movie.episodes.forEach((e) => {
        if (!grouped[e.serverName]) grouped[e.serverName] = [];
        grouped[e.serverName].push(e);
      });
      const servers = Object.values(grouped);
      if (servers.length > 0) {
        // If currentServer is not set or not in list, pick the first server
        if (!currentServer || !grouped[currentServer]) {
          setCurrentServer(servers[0][0].serverName);
        }
      }
    }
  }, [movie, currentServer]);

  const groupEpisodesByServer = (episodes?: Episode[]) => {
    if (!episodes) return [];
    const grouped: { [k: string]: Episode[] } = {};
    episodes.forEach((e) => {
      if (!grouped[e.serverName]) grouped[e.serverName] = [];
      grouped[e.serverName].push(e);
    });
    return Object.entries(grouped).map(([name, eps]) => ({ name, episodes: eps }));
  };

  const servers = movie?.episodes ? groupEpisodesByServer(movie.episodes) : [];
  const currentServerEpisodes = servers.find((s) => s.name === currentServer)?.episodes || [];

  const currentEpData =
    movie?.episodes?.find((e) => e.slug === ep && e.serverName === currentServer) ||
    movie?.episodes?.find((e) => e.slug === ep) ||
    (movie?.episodes && movie.episodes.length > 0 ? movie.episodes[0] : null);

  const lastSavedSecRef = useRef<number>(-1);
  const lastSavedTimestampRef = useRef<number>(0);

  const recordView = useRecordView();
  const recordedRef = useRef<string>('');

  // Automatically record view when user begins watching this episode
  useEffect(() => {
    if (!slug || !ep || !currentEpData) return;
    const key = `${slug}:${ep}`;
    if (recordedRef.current !== key) {
      recordedRef.current = key;
      recordView.mutate({
        slug,
        episodeSlug: ep,
        serverName: currentEpData.serverName || currentServer || undefined,
      });
    }
  }, [slug, ep, currentEpData, currentServer, recordView]);

  // Immediately record watch history on mount/episode change so it appears in profile
  useEffect(() => {
    if (!isAuthenticated || !movie?.slug || !currentEpData || !currentServer) return;

    saveProgress({
      movieSlug: movie.slug,
      movieId: movie.id,
      episodeSlug: ep,
      serverName: currentServer,
      progressSec: initialTime || 0,
    }).catch(() => {});
  }, [isAuthenticated, movie?.slug, movie?.id, ep, currentServer, currentEpData, initialTime, saveProgress]);

  // Throttled progress save during playback
  const handleTimeUpdate = (time: number) => {
    if (!isAuthenticated || !movie || !currentServer) return;
    const currentSec = Math.floor(time);
    const now = Date.now();

    if (
      Math.abs(currentSec - lastSavedSecRef.current) >= 5 &&
      now - lastSavedTimestampRef.current >= 5000
    ) {
      lastSavedSecRef.current = currentSec;
      lastSavedTimestampRef.current = now;
      saveProgress({
        movieId: movie.id,
        movieSlug: movie.slug,
        episodeSlug: ep,
        serverName: currentServer,
        progressSec: currentSec,
      }).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-dark text-white flex flex-col">
        <Navbar />
        <main className="flex-grow pt-[68px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix-red" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!movie || !currentEpData) {
    return (
      <div className="min-h-screen bg-netflix-dark text-white flex flex-col">
        <Navbar />
        <main className="flex-grow pt-[68px] flex flex-col items-center justify-center text-white gap-4 py-20">
          <p className="text-lg">Không tìm thấy tập phim.</p>
          <Link href={`/movies/${slug}`} className="text-netflix-red hover:underline">
            Quay lại trang phim
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-dark text-white flex flex-col">
      <Navbar />
      <main className="flex-grow pt-[68px]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-3">
            <Link
              href={`/movies/${slug}`}
              className="inline-flex items-center text-sm text-netflix-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" /> Quay lại thông tin phim
            </Link>
          </div>

          <VideoPlayer
            m3u8Url={currentEpData.m3u8Url}
            embedUrl={currentEpData.embedUrl}
            initialTime={initialTime}
            onTimeUpdate={handleTimeUpdate}
          />
          <p className="mt-2 text-xs text-netflix-text-secondary">
            💡 <em>Mẹo: Nếu trình phát báo lỗi chặn quảng cáo hoặc khóa phiên do mở F12 (DevTools), vui lòng tạm dừng AdBlock, tắt F12 và mở lại video trong tab mới để tiếp tục xem.</em>
          </p>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{movie.name}</h1>
              <p className="text-netflix-text-secondary text-sm mt-1">
                {currentEpData.name} — {currentServer}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div
                className="flex items-center gap-1.5 bg-netflix-card/80 border border-netflix-hover/60 px-3 py-1.5 rounded-full"
                title={`${currentEpData.views || 0} lượt xem tập này`}
              >
                <Eye className="w-4 h-4 text-netflix-red" />
                <span className="text-netflix-text-secondary text-xs sm:text-sm">
                  Tập: <strong className="text-white font-semibold">{formatViews(currentEpData.views)}</strong>
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 bg-netflix-card/80 border border-netflix-hover/60 px-3 py-1.5 rounded-full"
                title={`${movie.views || 0} tổng lượt xem phim`}
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-netflix-text-secondary text-xs sm:text-sm">
                  Tổng phim: <strong className="text-white font-semibold">{formatViews(movie.views)}</strong>
                </span>
              </div>
            </div>
          </div>
          <ServerSelector
            servers={servers}
            currentServer={currentServer}
            onServerChange={setCurrentServer}
          />
          <EpisodeNav
            slug={slug}
            currentEp={ep}
            episodes={currentServerEpisodes.map((e) => ({ name: e.name, slug: e.slug }))}
          />
          <div className="mt-8 pb-12">
            <h2 className="text-lg font-bold mb-4">Danh sách tập</h2>
            <EpisodeList
              episodes={movie.episodes || []}
              movieSlug={slug}
              currentEp={ep}
              currentServer={currentServer}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-netflix-dark flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix-red" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
