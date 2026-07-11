import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full bg-black text-white pt-16 pb-12 px-6 md:px-12 lg:px-24 border-t-8 border-white">
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Logo Column */}
        <div className="col-span-1 md:col-span-1">
          <div className="font-pixel text-[48px] leading-none text-black mb-6 bg-neo-green px-6 py-4 border-4 border-white inline-block card-brutal rotate-[-2deg]">
            HUSTL
          </div>
          <p className="font-sans text-xl text-white font-black uppercase tracking-tighter bg-black border-4 border-white inline-block px-4 py-2 card-brutal shadow-[4px_4px_0px_#FFF]">SWIPE YOUR WAY TO SUCCESS.</p>
        </div>

        {/* Links Column 1 */}
        <div className="col-span-1">
          <h4 className="font-sans text-3xl uppercase tracking-tighter text-neo-pink font-black mb-6 border-b-4 border-neo-pink inline-block pb-1">Platform</h4>
          <ul className="space-y-4">
            <li><a href="#students" className="font-sans text-xl text-white hover:text-black hover:bg-neo-yellow px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">For Students</a></li>
            <li><a href="#businesses" className="font-sans text-xl text-white hover:text-black hover:bg-neo-yellow px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">For Businesses</a></li>
            <li><a href="#pricing" className="font-sans text-xl text-white hover:text-black hover:bg-neo-yellow px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Pricing</a></li>
            <li><a href="#success" className="font-sans text-xl text-white hover:text-black hover:bg-neo-yellow px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Success Stories</a></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="col-span-1">
          <h4 className="font-sans text-3xl uppercase tracking-tighter text-neo-blue font-black mb-6 border-b-4 border-neo-blue inline-block pb-1">Company</h4>
          <ul className="space-y-4">
            <li><a href="#about" className="font-sans text-xl text-white hover:text-black hover:bg-neo-pink px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">About Hustl</a></li>
            <li><a href="#careers" className="font-sans text-xl text-white hover:text-black hover:bg-neo-pink px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Careers</a></li>
            <li><a href="#blog" className="font-sans text-xl text-white hover:text-black hover:bg-neo-pink px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Blog</a></li>
            <li><a href="mailto:hello@hustl.app" className="font-sans text-xl text-white hover:text-black hover:bg-neo-pink px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Contact</a></li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div className="col-span-1">
          <h4 className="font-sans text-3xl uppercase tracking-tighter text-neo-yellow font-black mb-6 border-b-4 border-neo-yellow inline-block pb-1">Resources</h4>
          <ul className="space-y-4">
            <li><a href="#help" className="font-sans text-xl text-white hover:text-black hover:bg-neo-green px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Help Center</a></li>
            <li><a href="#safety" className="font-sans text-xl text-white hover:text-black hover:bg-neo-green px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Safety Guidelines</a></li>
            <li><a href="#privacy" className="font-sans text-xl text-white hover:text-black hover:bg-neo-green px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Privacy Policy</a></li>
            <li><a href="#terms" className="font-sans text-xl text-white hover:text-black hover:bg-neo-green px-3 py-2 border-4 border-transparent hover:border-white font-black uppercase tracking-tighter transition-none inline-block btn-brutal">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full pt-8 border-t-8 border-white flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="font-sans text-xl text-white font-black uppercase tracking-tighter">
          © {new Date().getFullYear()} HUSTL. MADE WITH BRUTALISM.
        </p>
        <div className="flex space-x-4">
          <a href="https://twitter.com/hustlapp" className="font-sans text-xl font-black uppercase bg-neo-yellow text-black px-4 py-2 border-4 border-white hover:bg-white hover:text-black transition-none btn-brutal shadow-[4px_4px_0px_#FFF]">TWITTER</a>
          <a href="https://linkedin.com/company/hustlapp" className="font-sans text-xl font-black uppercase bg-neo-blue text-black px-4 py-2 border-4 border-white hover:bg-white hover:text-black transition-none btn-brutal shadow-[4px_4px_0px_#FFF]">LINKEDIN</a>
          <a href="https://instagram.com/hustl.app" className="font-sans text-xl font-black uppercase bg-neo-pink text-black px-4 py-2 border-4 border-white hover:bg-white hover:text-black transition-none btn-brutal shadow-[4px_4px_0px_#FFF]">INSTAGRAM</a>
        </div>
      </div>
    </footer>
  );
};
