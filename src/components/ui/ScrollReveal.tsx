import React, { useEffect, useRef, useState } from 'react';

export type RevealAnimation =
  | 'fade-up'
  | 'fade-down'
  | 'fade-in'
  | 'scale-up'
  | 'slide-left'
  | 'slide-right'
  | 'apple-card';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: RevealAnimation;
  delay?: number; // in milliseconds
  duration?: number; // in milliseconds
  threshold?: number;
  rootMargin?: string;
  className?: string;
  as?: React.ElementType;
  triggerOnce?: boolean;
  style?: React.CSSProperties;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 750,
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  className = '',
  as: Component = 'div',
  triggerOnce = true,
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = elementRef.current;
    if (!target) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce) {
              observer.unobserve(target);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  // Initial hidden transforms and Apple-style smooth final state
  const getTransformStyles = () => {
    if (isVisible) {
      return {
        opacity: 1,
        transform: 'translate3d(0, 0, 0) scale(1)',
        filter: 'blur(0px)',
      };
    }

    switch (animation) {
      case 'fade-up':
        return {
          opacity: 0,
          transform: 'translate3d(0, 32px, 0)',
          filter: 'blur(1px)',
        };
      case 'fade-down':
        return {
          opacity: 0,
          transform: 'translate3d(0, -32px, 0)',
          filter: 'blur(1px)',
        };
      case 'scale-up':
      case 'apple-card':
        return {
          opacity: 0,
          transform: 'translate3d(0, 28px, 0) scale(0.96)',
          filter: 'blur(1.5px)',
        };
      case 'slide-left':
        return {
          opacity: 0,
          transform: 'translate3d(-36px, 0, 0)',
          filter: 'blur(1px)',
        };
      case 'slide-right':
        return {
          opacity: 0,
          transform: 'translate3d(36px, 0, 0)',
          filter: 'blur(1px)',
        };
      case 'fade-in':
      default:
        return {
          opacity: 0,
          transform: 'none',
          filter: 'blur(2px)',
        };
    }
  };

  const transformStyles = getTransformStyles();

  // Signature Apple fluid curve: cubic-bezier(0.16, 1, 0.3, 1)
  const transitionTiming = 'cubic-bezier(0.16, 1, 0.3, 1)';

  return (
    <Component
      ref={elementRef}
      className={`scroll-reveal-container ${className}`}
      style={{
        ...style,
        opacity: transformStyles.opacity,
        transform: transformStyles.transform,
        filter: transformStyles.filter,
        transition: `opacity ${duration}ms ${transitionTiming} ${delay}ms, transform ${duration}ms ${transitionTiming} ${delay}ms, filter ${duration}ms ${transitionTiming} ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform, filter',
      }}
    >
      {children}
    </Component>
  );
};
