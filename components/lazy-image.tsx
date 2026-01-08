import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** 预加载占位背景色 */
  placeholderColor?: string;
  /** 是否禁用懒加载（用于首屏图片） */
  priority?: boolean;
}

/**
 * LazyImage 组件
 * 支持原生 loading="lazy" + IntersectionObserver fallback
 * 兼容性说明：
 * - 现代浏览器使用原生 loading="lazy"
 * - 旧浏览器使用 IntersectionObserver polyfill
 * - 如果都不支持，则直接加载图片
 */
export const LazyImage = ({
  src,
  alt,
  placeholderColor = "#f1f5f9",
  priority = false,
  className = "",
  style,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // 检测是否支持原生 loading="lazy"
  const supportsNativeLazy =
    typeof HTMLImageElement !== "undefined" &&
    "loading" in HTMLImageElement.prototype;

  useEffect(() => {
    // 如果是首屏图片，直接加载
    if (priority) {
      setShouldLoad(true);
      return;
    }

    // 如果支持原生懒加载，让浏览器处理
    if (supportsNativeLazy) {
      setShouldLoad(true);
      return;
    }

    // 使用 IntersectionObserver 作为 fallback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // 提前 200px 开始加载
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, supportsNativeLazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-wrapper ${className}`}
      style={{
        backgroundColor: isLoaded ? "transparent" : placeholderColor,
        transition: "background-color 0.3s ease",
        ...style,
      }}
    >
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          className={className}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
            ...style,
          }}
          {...props}
        />
      )}
    </div>
  );
};

/**
 * LazyBackgroundImage 组件
 * 用于需要懒加载的背景图片
 */
interface LazyBackgroundImageProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** 是否禁用懒加载 */
  priority?: boolean;
}

export const LazyBackgroundImage = ({
  src,
  className = "",
  style,
  children,
  priority = false,
}: LazyBackgroundImageProps) => {
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px",
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        backgroundImage: isInView ? `url('${src}')` : undefined,
        backgroundColor: isInView ? undefined : "#f1f5f9",
        transition: "background-image 0.3s ease",
      }}
    >
      {children}
    </div>
  );
};

