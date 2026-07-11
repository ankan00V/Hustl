import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import { cn } from '../../lib/utils';
import { Star, MapPin, Clock } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';

interface GigCard {
  id: number;
  title: string;
  category: string;
  payRate: string;
  location: string;
  duration: string;
  description: string;
  rating: number;
  image: string;
  bgColor: string;
}

const STUDENT_GIGS: GigCard[] = [
  {
    id: 1,
    title: "Barista & Cafe Assistant",
    category: "Coffee/Barista",
    payRate: "$18.50/hr",
    location: "Downtown Brews (0.5 mi)",
    duration: "Flexible Shifts",
    description: "Looking for a friendly student to join our team. Learn latte art, handle orders, and vibes with local regulars.",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500",
    bgColor: "bg-neo-green"
  },
  {
    id: 2,
    title: "Python Programming Tutor",
    category: "Laptop/Tutor",
    payRate: "$30.00/hr",
    location: "Campus Library / Remote",
    duration: "4 hrs/week",
    description: "Help first-year computer science students master coding basics, OOP concepts, and debug their lab assignments.",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500",
    bgColor: "bg-neo-blue"
  },
  {
    id: 3,
    title: "Archive Research Helper",
    category: "Library/Assistant",
    payRate: "$20.00/hr",
    location: "Special Collections Library",
    duration: "Temp (2 weeks)",
    description: "Scan historical manuscripts, catalogue catalog entries, and assist the history department with sorting archives.",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500",
    bgColor: "bg-neo-yellow"
  },
  {
    id: 4,
    title: "Graphic Design Assistant",
    category: "Drawing/Design",
    payRate: "$25.00/hr",
    location: "Hustl Creative Lab",
    duration: "Project-based",
    description: "Create social media graphics, posters, and simple UI assets for university campus campaigns.",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500",
    bgColor: "bg-neo-pink"
  }
];

export const Skiper48 = () => {
  return (
    <section className="w-full bg-white text-black py-10 px-6 md:px-12 lg:px-24 border-b-4 border-black flex flex-col items-center select-none overflow-hidden">
      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Copywriting */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <span className="font-mono text-xs uppercase tracking-widest bg-neo-pink text-white px-3 py-1 border-2 border-black font-bold mb-6">
            HOT OFF THE PRESS
          </span>
          <h2 className="font-sans font-black text-5xl md:text-7xl uppercase leading-[0.9] tracking-tighter mb-4">
            DISCOVER <br />
            STUDENT <span className="font-serif italic font-normal text-neo-pink lowercase">gigs.</span>
          </h2>
          <p className="font-serif text-xl md:text-2xl italic text-black/85 max-w-md mb-8">
            Swipe through real, verified postings from local cafes, departments, and startups. Drag the card stack to explore!
          </p>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white border-4 border-black shadow-brutal flex items-center justify-center font-bold font-mono">
              4
            </div>
            <div className="font-mono text-sm uppercase font-bold tracking-wider">
              Gigs open in your campus area
            </div>
          </div>
        </div>

        {/* Right Side: Swiper Cards Effect Carousel */}
        <div className="lg:col-span-6 w-full flex justify-center py-6">
          <div className="w-full max-w-[340px]">
            <Swiper
              effect={'cards'}
              grabCursor={true}
              modules={[EffectCards]}
              className="mySwiper overflow-visible"
            >
              {STUDENT_GIGS.map((gig) => (
                <SwiperSlide 
                  key={gig.id} 
                  className={cn("card-brutal overflow-hidden bg-white flex flex-col h-[460px]")}
                >
                  {/* Card Image */}
                  <div className="relative h-44 w-full border-b-4 border-black">
                    <img 
                      src={gig.image} 
                      alt={gig.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black text-white text-xs font-mono font-bold px-2.5 py-1 border-2 border-white uppercase">
                      {gig.category}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between bg-white">
                    <div>
                      {/* Rating & Pay */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1 font-mono font-bold text-sm bg-neo-yellow text-black px-2 py-0.5 border-2 border-black shadow-brutal">
                          <Star className="w-3.5 h-3.5 fill-black" />
                          <span>{gig.rating}</span>
                        </div>
                        <div className="font-mono font-black text-base text-black bg-white border-2 border-black px-2 py-0.5 shadow-brutal">
                          {gig.payRate}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-sans font-black text-xl uppercase tracking-tight text-black line-clamp-1 mb-2">
                        {gig.title}
                      </h3>

                      {/* Description */}
                      <p className="font-serif text-sm italic text-black/75 line-clamp-3 mb-4">
                        "{gig.description}"
                      </p>
                    </div>

                    {/* Metadata Badges */}
                    <div className="space-y-2 mt-auto border-t-2 border-black/10 pt-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-black/80">
                        <MapPin className="w-3.5 h-3.5 text-neo-pink" />
                        <span className="font-bold truncate">{gig.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-black/80">
                        <Clock className="w-3.5 h-3.5 text-neo-green" />
                        <span className="font-bold">{gig.duration}</span>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

      </div>
    </section>
  );
};
