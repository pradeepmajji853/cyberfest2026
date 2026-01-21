import { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode[];
  reverse?: boolean;
  speed?: number;
  pauseOnHover?: boolean;
}

const Marquee = ({ children, reverse = false, speed = 20, pauseOnHover = true }: MarqueeProps) => {
  return (
    <div className="relative overflow-hidden w-full">
      <div
        className={`flex w-max items-center ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} ${
          pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
        }`}
        style={{ ['--marquee-duration' as string]: `${speed}s` }}
      >
        {[...children, ...children].map((child, index) => (
          <div key={index} className="mx-4 shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
