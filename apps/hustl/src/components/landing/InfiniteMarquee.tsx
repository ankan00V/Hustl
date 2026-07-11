'use client';

import React from 'react';

const MESSAGES = [
  "Swipe Right on Opportunity",
  "Match with Your Dream Gig",
  "Instant Job Connections",
  "Students Meet Businesses",
  "Part-Time Made Easy",
  "Freelance Your Way",
  "Campus to Career",
  "Gig Economy Simplified"
];

// Duplicate for smooth infinite scroll
const SCROLL_ITEMS = [...MESSAGES, ...MESSAGES];

export const InfiniteMarquee = () => {
  return (
    <section className="w-full bg-neo-yellow border-b-4 border-black py-4 text-black uppercase overflow-hidden">
      <div className="w-full relative flex items-center">
        <div className="flex whitespace-nowrap animate-marquee">
          {SCROLL_ITEMS.map((message, i) => (
            <div
              key={i}
              className="flex items-center mx-8 md:mx-12 lg:mx-16"
            >
              <span className="font-black tracking-tight text-black text-3xl">
                {message}
              </span>
              <span className="mx-8 md:mx-12 text-3xl text-black font-black">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
