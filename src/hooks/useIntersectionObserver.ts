/**
 * Intersection Observer 커스텀 훅
 * 무한 스크롤, lazy loading 등에 사용
 */

import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * Intersection Observer 훅
 */
export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
): [Dispatch<SetStateAction<Element | null>>, boolean] => {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [node, setNode] = useState<Element | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 이미 보이고 freeze 옵션이 켜져 있으면 observer 생성 안함
    if (freezeOnceVisible && isIntersecting) {
      return;
    }

    // 이전 observer 정리
    if (observer.current) {
      observer.current.disconnect();
    }

    // 노드가 없으면 observer 생성 안함
    if (!node) {
      return;
    }

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.current.observe(node);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [node, threshold, root, rootMargin, freezeOnceVisible, isIntersecting]);

  return [setNode, isIntersecting];
};

interface UseInfiniteScrollOptions {
  hasMore?: boolean;
  threshold?: number;
}

/**
 * 무한 스크롤 훅
 */
export const useInfiniteScroll = (
  onLoadMore: () => Promise<void>,
  options: UseInfiniteScrollOptions = {}
): [Dispatch<SetStateAction<Element | null>>, boolean] => {
  const { hasMore = true, threshold = 1.0 } = options;
  const [loading, setLoading] = useState(false);
  const [setRef, isIntersecting] = useIntersectionObserver({ threshold });

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      setLoading(true);
      onLoadMore().finally(() => setLoading(false));
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  return [setRef, loading];
};

/**
 * Lazy Loading 이미지 훅
 */
export const useLazyImage = (
  src: string
): [Dispatch<SetStateAction<Element | null>>, string | null, boolean] => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [setRef, isIntersecting] = useIntersectionObserver({
    threshold: 0,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (isIntersecting && src && !loaded) {
      setImageSrc(src);
      setLoaded(true);
    }
  }, [isIntersecting, src, loaded]);

  return [setRef, imageSrc, loaded];
};

export default useIntersectionObserver;
