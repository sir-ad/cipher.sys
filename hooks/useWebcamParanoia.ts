import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebcamParanoia = () => {
  const [isParanoiaActive, setIsParanoiaActive] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevDataRef = useRef<Uint8ClampedArray | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleParanoia = useCallback(async () => {
    if (isParanoiaActive) {
      // Deactivate
      setIsParanoiaActive(false);
      setMotionDetected(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    } else {
      // Activate
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
        });
        streamRef.current = stream;
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        videoRef.current = video;

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvasRef.current = canvas;

        setIsParanoiaActive(true);
      } catch (e) {
        alert('[!] WEBCAM ACCESS DENIED.\n\nParanoia protocol requires visual telemetry. Ensure camera permissions are granted.');
      }
    }
  }, [isParanoiaActive]);

  useEffect(() => {
    if (!isParanoiaActive || !videoRef.current || !canvasRef.current) return;

    let reqId: number;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    
    const checkMotion = () => {
      if (!ctx || !videoRef.current || !canvasRef.current) return;
      
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const currentData = ctx.getImageData(0, 0, 320, 240).data;
        const prevData = prevDataRef.current;

        if (prevData) {
          let changedPixels = 0;
          
          // Skip pixels to optimize performance (check every 16th pixel)
          for (let i = 0; i < currentData.length; i += 64) {
            const rDiff = Math.abs(currentData[i] - prevData[i]);
            const gDiff = Math.abs(currentData[i+1] - prevData[i+1]);
            const bDiff = Math.abs(currentData[i+2] - prevData[i+2]);
            
            // If color distance is significant, it's motion
            if (rDiff + gDiff + bDiff > 120) { 
              changedPixels++;
            }
          }

          // If enough pixels changed across the grid, trigger lockdown
          if (changedPixels > 100) { 
            setMotionDetected(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            // Hold the blur for 3.5 seconds after motion stops
            timeoutRef.current = setTimeout(() => setMotionDetected(false), 3500); 
          }
        }
        
        // Save current frame for next comparison
        prevDataRef.current = new Uint8ClampedArray(currentData);
      }
      
      // Run roughly 15-20 times a second to save CPU
      setTimeout(() => {
        reqId = requestAnimationFrame(checkMotion);
      }, 50);
    };

    checkMotion();

    return () => {
      cancelAnimationFrame(reqId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isParanoiaActive]);

  return { isParanoiaActive, motionDetected, toggleParanoia };
};