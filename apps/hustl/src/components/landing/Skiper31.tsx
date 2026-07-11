import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Custom inline SVG icons for the 9 platforms
const FigmaIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0C13.75 0 9.5 4.25 9.5 9.5C9.5 14.75 13.75 19 19 19C24.25 19 28.5 14.75 28.5 9.5C28.5 4.25 24.25 0 19 0Z" fill="#F24E1E"/>
    <path d="M9.5 28.5C9.5 23.25 13.75 19 19 19C24.25 19 28.5 23.25 28.5 28.5C28.5 33.75 24.25 38 19 38C13.75 38 9.5 33.75 9.5 28.5Z" fill="#A259FF"/>
    <path d="M9.5 47.5C9.5 42.25 13.75 38 19 38V57C13.75 57 9.5 52.75 9.5 47.5Z" fill="#0ACF83"/>
    <path d="M0 9.5C0 4.25 4.25 0 9.5 0V19H9.5C4.25 19 0 14.75 0 9.5Z" fill="#F24E1E"/>
    <path d="M0 28.5C0 23.25 4.25 19 9.5 19V38H9.5C4.25 38 0 33.75 0 28.5Z" fill="#1ABCFE"/>
  </svg>
);

const FramerIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 16h14L12 9h7V2H5l7 7H5z" fill="currentColor"/>
  </svg>
);

const GithubIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 127.14 96.36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.33,2.53-2a75.46,75.46,0,0,0,72.93,0c.81.71,1.65,1.39,2.53,2a68.86,68.86,0,0,1-10.5,5,78.52,78.52,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.86,49.58,123.6,26.85,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.72,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96,53,91,65.69,84.69,65.69Z"/>
  </svg>
);

const NotionIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.6 2h14.8c1 0 1.8.8 1.8 1.8v16.4c0 1-.8 1.8-1.8 1.8H4.6c-1 0-1.8-.8-1.8-1.8V3.8c0-1 .8-1.8 1.8-1.8zm2.6 3.9v12.2h2.2l4.1-6.6v6.6h2.7V5.9h-2.2l-4.1 6.6V5.9H7.2z"/>
  </svg>
);

const SlackIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.043zm2.52-6.342a2.528 2.528 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.52 2.522v2.52H8.823zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043zm6.354-6.302a2.528 2.528 0 0 1 2.52-2.523 2.528 2.528 0 0 1 2.522 2.523 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52H6.353a2.528 2.528 0 0 1-2.52-2.52V1.261A2.528 2.528 0 0 1 6.353-1.26h5.043a2.528 2.528 0 0 1 2.52 1.26v5.043zm-2.52 6.342a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.52-2.522v-2.52h2.52zm0-1.261a2.528 2.528 0 0 1-2.52-2.52V3.78a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522v5.043a2.528 2.528 0 0 1-2.522 2.52H15.18z"/>
  </svg>
);

const VSCodeIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.985 6.907L16.29 1.13c-.39-.294-.946-.226-1.25.155l-7.252 9.07L2.4 6.13c-.382-.29-.933-.217-1.233.16L.162 7.55c-.274.348-.22.855.12 1.144L5.64 12 .28 15.306c-.342.29-.395.796-.12 1.144l1.005 1.26c.3.376.85.45 1.232.16l5.388-4.226 7.253 9.07c.304.38.86.45 1.25.155l7.695-5.776c.453-.34.618-.958.39-1.472L19.23 12l4.364-3.62c.228-.515.064-1.134-.39-1.473zM15.42 12.015L7.965 6.19l7.456-5.82 4.46 9.774-4.46 1.87z"/>
  </svg>
);

const ChromeIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 4.5c4.14 0 7.5 3.36 7.5 7.5 0 .79-.12 1.55-.35 2.27L12 8.78V4.5zm0 15c-3.17 0-5.87-1.96-6.97-4.75L9.38 7.64l4.98 8.63A7.472 7.472 0 0 1 12 19.5z"/>
  </svg>
);

const ReactIcon = () => (
  <svg className="w-8 h-8 animate-[spin_10s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(0, 12, 12)" />
    <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60, 12, 12)" />
    <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120, 12, 12)" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const Skiper31 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position of the section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Transform scroll progress into horizontal movement
  const xLeft = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const xRight = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);

  const icons = [
    <FigmaIcon key="figma" />,
    <FramerIcon key="framer" />,
    <GithubIcon key="github" />,
    <DiscordIcon key="discord" />,
    <NotionIcon key="notion" />,
    <SlackIcon key="slack" />,
    <VSCodeIcon key="vscode" />,
    <ChromeIcon key="chrome" />,
    <ReactIcon key="react" />
  ];

  return (
    <div 
      ref={containerRef}
      className="w-full bg-neo-bg border-b-4 border-black py-6 overflow-hidden flex flex-col gap-4 select-none"
    >
      {/* First Marquee Row: scrolls left */}
      <div className="flex whitespace-nowrap">
        <motion.div style={{ x: xLeft }} className="flex gap-16 items-center pr-16 text-black font-sans font-black text-5xl md:text-7xl uppercase tracking-tighter">
          {[...Array(6)].map((_, i) => (
            <React.Fragment key={i}>
              <span>see more from <span className="text-neo-pink">HUSTL</span></span>
              <div className="flex gap-4 items-center text-black">
                {icons.slice(0, 5).map((icon, idx) => (
                  <motion.div 
                    key={idx} 
                    className="p-3 bg-white border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer rounded-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    {icon}
                  </motion.div>
                ))}
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Second Marquee Row: scrolls right */}
      <div className="flex whitespace-nowrap">
        <motion.div style={{ x: xRight }} className="flex gap-16 items-center pr-16 text-black font-sans font-black text-5xl md:text-7xl uppercase tracking-tighter">
          {[...Array(6)].map((_, i) => (
            <React.Fragment key={i}>
              <span>see more from <span className="text-neo-green">HUSTL</span></span>
              <div className="flex gap-4 items-center text-black">
                {icons.slice(5).map((icon, idx) => (
                  <motion.div 
                    key={idx} 
                    className="btn-brutal p-3 bg-white cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                  >
                    {icon}
                  </motion.div>
                ))}
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
