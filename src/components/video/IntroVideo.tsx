import { useState, useEffect, useRef } from 'react';

interface IntroVideoProps {
  videoSrc: string;
  onVideoEnd?: (lastFrameUrl?: string) => void;
}

const IntroVideo = ({ videoSrc, onVideoEnd }: IntroVideoProps) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleVideoEnd = () => {
      setVideoEnded(true);

      // Capture the last frame
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          setLastFrameUrl(dataUrl);

          // Call the callback with the captured frame
          onVideoEnd?.(dataUrl);
        }
      }
      
      // Removed internal fade out logic to let parent handle it
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('ended', handleVideoEnd);
      // Play the video when component mounts
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay failed:', error);
          // If autoplay fails, try to play on first user interaction
          const handleInteraction = () => {
            video.play().catch(e => console.log('Play failed after interaction:', e));
            document.removeEventListener('click', handleInteraction);
          };
          document.addEventListener('click', handleInteraction);
        });
      }
    }

    return () => {
      if (video) {
        video.removeEventListener('ended', handleVideoEnd);
      }
    };
  }, [onVideoEnd]);

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onVideoEnd?.();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Mobile-optimized video container */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            loop={false}
            className="w-full h-full object-contain sm:object-cover"
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              display: 'block',
            }}
          />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </>
  );
};

export default IntroVideo;
