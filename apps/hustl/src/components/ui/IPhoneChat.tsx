import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const chatMessages = [
  { id: 1, sender: "bot", text: "New gig alert! Local Cafe needs a barista ☕️" },
  { id: 2, sender: "user", text: "Swipe right! I'm available." },
  { id: 3, sender: "bot", text: "Match confirmed! Shift starts at 9AM tomorrow." },
  { id: 4, sender: "user", text: "Awesome. 🚀" },
  { id: 5, sender: "bot", text: "Shift completed. $75 deposited to your account. 💸" },
];

export const IPhoneChat = () => {
  const [messages, setMessages] = useState<typeof chatMessages>([]);
  
  useEffect(() => {
    let index = 0;
    
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    // Animate messages entering sequentially with realistic delays
    const scheduleMessages = () => {
      setMessages([]);
      index = 0;
      
      const addNextMessage = () => {
        if (index < chatMessages.length) {
          const currentMsg = chatMessages[index];
          setMessages((prev) => [...prev, currentMsg]);
          index++;
          // Variable delay based on who is sending
          const nextDelay = chatMessages[index]?.sender === "user" ? 1500 : 2500;
          timeouts.push(setTimeout(addNextMessage, nextDelay));
        } else {
          // Restart loop after showing all messages
          timeouts.push(setTimeout(scheduleMessages, 5000));
        }
      };
      
      timeouts.push(setTimeout(addNextMessage, 1000));
    };

    scheduleMessages();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-[280px] h-[550px] bg-white border-[6px] border-black rounded-[40px] shadow-brutal-xl overflow-hidden flex flex-col">
      {/* iPhone Notch Area */}
      <div className="absolute top-0 inset-x-0 h-8 flex justify-center z-20">
        <div className="w-[120px] h-6 bg-black rounded-b-[16px]"></div>
      </div>
      
      {/* Header */}
      <div className="pt-10 pb-4 px-4 bg-neo-yellow border-b-4 border-black flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neo-pink border-[3px] border-black flex items-center justify-center font-black text-black">
            H
          </div>
          <div className="font-sans font-black uppercase text-sm leading-none tracking-tight">
            Hustl <br /> <span className="text-[10px] font-mono font-medium text-black/70">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col justify-end gap-3 relative z-0">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
        
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`max-w-[85%] p-3 font-mono font-bold text-sm border-4 border-black ${
                msg.sender === "user" 
                  ? "bg-neo-blue text-black self-end rounded-l-xl rounded-tr-xl rounded-br-sm shadow-brutal-sm" 
                  : "bg-neo-green text-black self-start rounded-r-xl rounded-tl-xl rounded-bl-sm shadow-brutal-sm"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Input Area */}
      <div className="h-16 bg-white border-t-4 border-black p-3 flex items-center gap-2 z-10">
        <div className="flex-1 h-full border-4 border-black rounded-full bg-gray-100 flex items-center px-4 font-mono text-xs text-gray-400 font-bold uppercase">
          Type message...
        </div>
        <div className="w-10 h-10 bg-neo-pink border-4 border-black rounded-full flex items-center justify-center shadow-brutal-sm">
          <svg className="w-4 h-4 text-black stroke-[4px] ml-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </div>
      </div>
    </div>
  );
};
