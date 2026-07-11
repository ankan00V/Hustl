"use client";

import { gsap } from "gsap";
import React, { useEffect, useRef } from "react";

interface CrowdCanvasProps {
  src: string;
  rows?: number;
  cols?: number;
}

const CrowdCanvas = ({ src, rows = 15, cols = 7 }: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isUnmounted = false;
    const gsapCtx = gsap.context(() => {});

    const config = {
      src,
      rows,
      cols,
    };

    // UTILS
    const randomRange = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randomIndex = (array: any[]) => randomRange(0, array.length) | 0;
    const removeFromArray = (array: any[], i: number) => array.splice(i, 1)[0];
    const removeItemFromArray = (array: any[], item: any) =>
      removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = (array: any[]) =>
      removeFromArray(array, randomIndex(array));
    const getRandomFromArray = (array: any[]) => array[randomIndex(array) | 0];

    // TWEEN FACTORIES
    const resetPeep = ({ stage, peep }: { stage: any; peep: any }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY = 100 - 250 * gsap.parseEase("power2.in")(Math.random());
      const startY = stage.height - peep.height + offsetY;
      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;

      return {
        startX,
        startY,
        endX,
      };
    };

    const normalWalk = ({ peep, props }: { peep: any; props: any }) => {
      const { startX, startY, endX } = props;
      const xDuration = 10;
      const yDuration = 0.25;

      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(
        peep,
        {
          duration: xDuration,
          x: endX,
          ease: "none",
        },
        0,
      );
      tl.to(
        peep,
        {
          duration: yDuration,
          repeat: xDuration / yDuration,
          yoyo: true,
          y: startY - 10,
        },
        0,
      );

      return tl;
    };

    const walks = [normalWalk];

    // TYPES
    type Peep = {
      image: HTMLImageElement;
      rect: number[];
      width: number;
      height: number;
      drawArgs: any[];
      x: number;
      y: number;
      anchorY: number;
      scaleX: number;
      walk: any;
      setRect: (rect: number[]) => void;
      render: (ctx: CanvasRenderingContext2D) => void;
    };

    // FACTORY FUNCTIONS
    const createPeep = ({
      image,
      rect,
    }: {
      image: HTMLImageElement;
      rect: number[];
    }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        drawArgs: [],
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        setRect: (rect: number[]) => {
          peep.rect = rect;
          peep.width = rect[2];
          peep.height = rect[3];
          peep.drawArgs = [peep.image, ...rect, 0, 0, peep.width, peep.height];
        },
        render: (ctx: CanvasRenderingContext2D) => {
          ctx.save();
          ctx.translate(peep.x, peep.y);
          ctx.scale(peep.scaleX, 1);
          ctx.drawImage(
            peep.image,
            peep.rect[0],
            peep.rect[1],
            peep.rect[2],
            peep.rect[3],
            0,
            0,
            peep.width,
            peep.height,
          );
          ctx.restore();
        },
      };

      peep.setRect(rect);
      return peep;
    };

    // MAIN
    const img = document.createElement("img");
    const stage = {
      width: 0,
      height: 0,
    };

    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeeps = () => {
      const { rows, cols } = config;
      const { naturalWidth: width, naturalHeight: height } = img;
      const total = rows * cols;
      const rectWidth = width / rows;
      const rectHeight = height / cols;

      for (let i = 0; i < total; i++) {
        allPeeps.push(
          createPeep({
            image: img,
            rect: [
              (i % rows) * rectWidth,
              ((i / rows) | 0) * rectHeight,
              rectWidth,
              rectHeight,
            ],
          }),
        );
      }
    };

    const initCrowd = () => {
      while (availablePeeps.length) {
        const peep = addPeepToCrowd();
        if (peep && peep.walk) {
          peep.walk.progress(Math.random());
        } else {
          break;
        }
      }
    };

    const addPeepToCrowd = () => {
      if (isUnmounted) return;
      const peep = removeRandomFromArray(availablePeeps);
      let walk: any;
      gsapCtx.add(() => {
        walk = getRandomFromArray(walks)({
          peep,
          props: resetPeep({
            peep,
            stage,
          }),
        }).eventCallback("onComplete", () => {
          if (isUnmounted) return;
          removePeepFromCrowd(peep);
          addPeepToCrowd();
        });
      });

      peep.walk = walk;

      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);

      return peep;
    };

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    };

    const render = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);

      crowd.forEach((peep) => {
        peep.render(ctx);
      });

      ctx.restore();
    };

    const resize = () => {
      if (isUnmounted) return;
      if (!canvasRef.current) return;
      stage.width = canvasRef.current.clientWidth;
      stage.height = canvasRef.current.clientHeight;
      canvasRef.current.width = stage.width * devicePixelRatio;
      canvasRef.current.height = stage.height * devicePixelRatio;

      allPeeps.forEach((peep) => {
        if (peep.walk) {
          peep.walk.kill();
          peep.walk = null;
        }
      });

      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);

      initCrowd();
    };

    let isInitialized = false;
    const init = () => {
      if (isUnmounted || isInitialized) return;
      isInitialized = true;
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };

    img.onload = () => {
      if (!isUnmounted) init();
    };
    img.src = config.src;
    
    // If image is already loaded from cache, onload might not fire, so trigger manually
    if (img.complete && img.naturalWidth !== 0) {
      if (!isUnmounted) init();
    }

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 250);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isUnmounted = true;
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(render);
      gsapCtx.revert();
      allPeeps.forEach((peep) => {
        if (peep.walk) peep.walk.kill();
      });
    };
  }, [src, rows, cols]);

  return (
    <canvas ref={canvasRef} className="absolute bottom-0 h-[70vh] w-full opacity-60 mix-blend-multiply pointer-events-none" />
  );
};

const Skiper39 = () => {
  return (
    <div className="relative h-full w-full bg-neo-pink flex flex-col justify-center items-center text-black overflow-hidden group">
      
      {/* Background crowd animation using Canvas & GSAP */}
      <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />

      {/* Neo-brutalist Hero Centerpiece */}
      <div className="flex flex-col items-center justify-center p-6 text-center z-10 max-w-4xl bg-black border-4 border-white md:p-12 shadow-[12px_12px_0_0_#fff] rotate-1 group-hover:rotate-0 transition-transform duration-300">
        <h2 className="font-pixel text-[8vw] leading-[0.85] uppercase text-white mb-8">
          JOIN THE <br/> <span className="text-neo-yellow" style={{ textShadow: "6px 6px 0 #000" }}>CROWD</span>
        </h2>
        <button className="btn-brutal px-8 py-4 md:px-12 md:py-6 bg-neo-green text-black font-black text-xl md:text-2xl uppercase tracking-widest hover:bg-white transition-colors border-4 border-white shadow-[6px_6px_0_0_#fff]">
          Sign Up Now
        </button>
      </div>
    </div>
  );
};

export { CrowdCanvas, Skiper39 };
