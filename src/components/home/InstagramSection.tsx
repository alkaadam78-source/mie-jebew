import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, ExternalLink, Users, Sparkles, ChevronLeft, ChevronRight, Play, Pause, InstagramIcon } from '../ui/Icons';
import { INSTAGRAM_POSTS } from '../../data/menu';
import { STORE_CONFIG } from '../../config/store';
import { InstagramPost } from '../../types';
import { ScrollReveal } from '../ui/ScrollReveal';

interface InstagramCardProps {
  post: InstagramPost;
  badgeType: 'team' | 'teaser';
}

const InstagramCard: React.FC<InstagramCardProps> = ({ post, badgeType }) => {
  const slides = post.images && post.images.length > 0 ? post.images : [post.imageUrl];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-scroll to the right: normal interval 3.5s, speeds up slightly on hover/active to show more photos
  useEffect(() => {
    if (!isAutoPlaying) return;
    const intervalMs = isHovered ? 2000 : 3500;
    const timer = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, nextSlide]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      // Swiped left -> show next
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> show prev
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Specific object positioning to ensure faces and top content are never cut off
  const getImagePositionClass = () => {
    if (badgeType === 'team') {
      // Reflection faces are in the lower-middle portion of the dome
      return 'object-contain sm:object-cover object-[center_bottom] bg-neutral-900';
    }
    // Teaser headline "COMING SOON" is positioned higher up
    return 'object-cover object-[center_top] bg-neutral-900';
  };

  return (
    <div
      className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal hover:shadow-brutal-lg transition-all flex flex-col justify-between group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Visual Slider Container */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3] max-h-[340px] sm:max-h-[380px] overflow-hidden bg-neutral-950 select-none">
        {/* Slides Track */}
        <div
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((imgSrc, sIdx) => (
            <div key={sIdx} className="w-full h-full shrink-0 relative">
              <img
                src={imgSrc}
                alt={`${post.caption} - slide ${sIdx + 1}`}
                loading="lazy"
                className={`w-full h-full ${getImagePositionClass()} transition-transform duration-300`}
              />
            </div>
          ))}
        </div>

        {/* Top-Left Category Badge */}
        <div className="absolute top-3 left-3 bg-white border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-brutal-sm flex items-center gap-1.5 z-10">
          {badgeType === 'team' ? (
            <>
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>TEAM CRAVE CORNER</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>COMING SOON TEASER</span>
            </>
          )}
        </div>

        {/* Top-Right Likes & Slide Indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <span className="bg-white/95 text-black border-2 border-black text-[11px] font-black px-2 py-0.5 rounded-full shadow-brutal-xs">
            {currentSlide + 1}/{slides.length}
          </span>
          <div className="bg-black/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/40 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>{post.likes}</span>
          </div>
        </div>

        {/* Navigation Arrows (Interactive) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Slide sebelumnya"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Slide berikutnya"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </>
        )}

        {/* Bottom Carousel Controls & Dots */}
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-10 pointer-events-auto">
          {/* Pause / Play toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAutoPlaying((prev) => !prev);
            }}
            title={isAutoPlaying ? 'Jeda slide otomatis' : 'Mulai slide otomatis'}
            className="bg-black/75 hover:bg-black text-white p-1 rounded-full border border-white/40 text-[10px] flex items-center justify-center"
          >
            {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-yellow-300" />}
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
            {slides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(dotIdx);
                }}
                aria-label={`Pindah ke foto ${dotIdx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === dotIdx
                    ? 'w-6 bg-yellow-400 border border-black'
                    : 'w-2 bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>

          {isHovered && (
            <span className="hidden sm:inline-block bg-black/80 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 animate-pulse">
              Geser otomatis →
            </span>
          )}
        </div>
      </div>

      {/* Caption & Instagram CTA */}
      <div className="p-4 sm:p-5 space-y-3 bg-white flex flex-col justify-between grow">
        <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed">
          {post.caption}
        </p>

        <a
          href={post.url || post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between text-xs sm:text-sm font-black text-pink-600 hover:text-pink-700 hover:bg-pink-50/50 p-1.5 rounded-lg transition-colors cursor-pointer group/link"
        >
          <span className="flex items-center gap-1.5">
            <InstagramIcon className="w-4 h-4 text-pink-600 group-hover/link:rotate-6 transition-transform" />
            <span>Lihat Asli di Instagram @cravecorner0</span>
          </span>
          <ExternalLink className="w-4 h-4 text-black group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};

export const InstagramSection: React.FC = () => {
  return (
    <section id="tim-cravecorner" className="scroll-mt-20 py-8 sm:py-12 bg-cream border-t-3 border-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
                <InstagramIcon className="w-4 h-4" />
                OFFICIAL INSTAGRAM
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight mt-2">
                📸 TIM CRAVE CORNER & TEASER
              </h2>
              <p className="text-xs sm:text-sm font-bold text-gray-700 mt-1">
                Geser foto atau arahkan kursor untuk melihat foto tim dan bocoran menu spesial!
              </p>
            </div>

            <a
              href={STORE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-cream-200 text-black font-black text-xs sm:text-sm px-5 py-3 border-2 border-black rounded-xl shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all self-start sm:self-auto cursor-pointer"
            >
              <InstagramIcon className="w-4 h-4 text-pink-600" />
              <span>FOLLOW {STORE_CONFIG.instagramHandle}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </ScrollReveal>

        {/* Gallery: 2 prominent showcase cards with multi-slide carousels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INSTAGRAM_POSTS.map((post, idx) => (
            <ScrollReveal
              key={post.id}
              animation="apple-card"
              delay={idx * 140}
              duration={750}
              className="h-full"
            >
              <InstagramCard
                post={post}
                badgeType={idx === 0 ? 'team' : 'teaser'}
              />
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
