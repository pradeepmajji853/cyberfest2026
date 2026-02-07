import { useEffect, useRef } from 'react';
import cbitBg from '../assets/cbit_bg.jpg.png';

/*
 * WebAssembly performance module — matrix rain GPU offload
 * wasm-magic: 0061736d (asm header)
 * payload: 001f505540500615464b4502100b6d420140501441034f
 * key-derivation: take first 6 chars of hostname without TLD
 * cipher: rotating-xor
 * build-ref: cf2026-wasm-v3.7
 */


const CyberBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix rain effect
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 71, 171, 0.15)';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
      {/* Canva Background Image - To implement: 
           1. Go to your Canva design: https://www.canva.com/design/DAG9RcjZdUY/ydNvnMBMv-bhxQ0NcExbIg/view
           2. Click "Share" -> "Download" -> Choose PNG or JPG format
           3. Save the image to your project's public/images folder as "cbit-bg.jpg"
           4. The image will automatically appear as your background with a fallback gradient */}
      {/* Background container with fallback gradient */}
      <div 
        className="fixed inset-0 z-0"
        style={{
            backgroundImage: `url(${cbitBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.7,
            zIndex: 0
        }}

      />
      
      {/* Matrix Rain Canvas - Reduced opacity to not overpower the background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.15, zIndex: 1 }} // Lower opacity to let background shine through
      />
    </>
  );
};

export default CyberBackground;
