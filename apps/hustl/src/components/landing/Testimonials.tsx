import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "Hustl completely changed how we hire for short-term events. We found 5 catering staff in under an hour.",
    name: "Sarah Jenkins",
    role: "Event Coordinator",
    company: "Luxe Events"
  },
  {
    quote: "I made enough to cover my textbooks in one weekend just by doing a few local gigs. The app is incredibly smooth.",
    name: "Marcus T.",
    role: "Computer Science Student",
    company: "NYU"
  },
  {
    quote: "No cover letters, no lengthy interviews. Just match, work, and get paid. It's the future of gig work.",
    name: "Elena R.",
    role: "Graphic Designer",
    company: "Freelance"
  }
];

export const Testimonials = () => {
  const bgColors = ["bg-neo-pink", "bg-neo-green", "bg-neo-yellow"];

  return (
    <section id="testimonials" className="w-full py-20 bg-black text-white border-b-8 border-white">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
             <h2 className="font-sans text-[48px] md:text-[80px] leading-[0.9] tracking-tighter mb-4 text-white font-black uppercase">
               DON'T JUST TAKE <br className="hidden md:block"/> OUR <span className="text-neo-green bg-black px-2 border-4 border-neo-green card-brutal inline-block rotate-[-2deg]">WORD FOR IT.</span>
             </h2>
          </div>
          <p className="font-sans text-black max-w-sm text-xl leading-tight font-black tracking-tighter uppercase bg-neo-pink border-4 border-black p-4 card-brutal">
             Join thousands of students and businesses who are already changing how local work gets done.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => {
            const bgColor = bgColors[i % bgColors.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: -8, y: -8, boxShadow: "16px 16px 0px #FFFFFF" }}
                className={`card-brutal p-8 border-4 border-white rounded-none flex flex-col justify-between h-full cursor-pointer group ${bgColor} text-black shadow-[8px_8px_0px_#FFFFFF]`}
              >
                <div className="mb-8">
                  {/* SVG Quote Icon */}
                  <svg className="w-10 h-10 text-black mb-6 group-hover:rotate-12 transition-none" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                  </svg>
                  <p className="font-sans text-2xl md:text-3xl leading-none text-black font-black uppercase tracking-tighter">
                    "{t.quote}"
                  </p>
                </div>
                <div>
                  <p className="font-sans text-black font-black uppercase text-xl mb-1 tracking-tighter">{t.name}</p>
                  <p className="font-sans text-black text-sm tracking-tight uppercase font-black bg-white inline-block px-2 py-1 border-2 border-black">{t.role} @ {t.company}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
