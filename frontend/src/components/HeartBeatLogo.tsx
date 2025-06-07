"use client";

import { useEffect, useState, useRef } from "react";
import { HeartPulse, ServerCog, Activity } from "lucide-react";
import { cn } from "../../lib/utils";

interface HeartBeatLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  theme?: "auto" | "light" | "dark" | "medical" | "electric" | "minimal";
  animated?: boolean;
  pulseSpeed?: "slow" | "normal" | "fast";
  status?: "healthy" | "degraded" | "critical";
}

export default function HeartBeatLogo({
  size = "md",
  showText = true,
  theme = "electric",
  animated = true,
  pulseSpeed = "normal",
  status = "healthy",
}: HeartBeatLogoProps) {
  const [pulse, setPulse] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [ecgPath, setEcgPath] = useState("");
  const lastBeatTime = useRef<number>(0);
  const beatInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (theme === "auto") {
      const checkDarkMode = () => {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      };
      checkDarkMode();
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", checkDarkMode);
      return () => mediaQuery.removeEventListener("change", checkDarkMode);
    } else {
      setIsDark(theme === "dark" || theme === "electric");
    }
  }, [theme]);

  const generateEcgPath = (strongBeat: boolean) => {
    const basePoints = [];
    const pointsCount = 16;
    const amplitude = strongBeat ? 40 : 20 + Math.random() * 10;
    const irregularity = Math.random() * 0.3;

    for (let i = 0; i < pointsCount; i++) {
      const x = i * (90 / (pointsCount - 1)) + 5;
      let y = 50;

      if (i === 2 || i === 3) {
        y = 50 - amplitude * 0.2;
      } else if (i === 5) {
        y = 50 + amplitude * 0.3;
      } else if (i === 6) {
        y = 50 - amplitude * 0.8;
      } else if (i === 7) {
        y = 50 + amplitude * 0.5;
      } else if (i === 9 || i === 10) {
        y = 50 - amplitude * 0.3;
      } else {
        y = 50 + (Math.random() * 4 - 2) * irregularity;
      }

      basePoints.push({ x, y });
    }

    let path = `M${basePoints[0].x} ${basePoints[0].y}`;
    for (let i = 1; i < basePoints.length; i++) {
      path += ` L${basePoints[i].x} ${basePoints[i].y}`;
    }

    return path;
  };

  const generatePulseNumber = () => {
    const base = 70; // Average pulse
    const variation = Math.floor(Math.random() * 21) - 10; // -10 to +10 variation
    return Math.max(50, Math.min(120, base + variation)); // Keep within 50-120 range
  };

  useEffect(() => {
    if (!animated) return;

    const baseSpeeds = {
      slow: 4000,
      normal: 1500,
      fast: 4000,
    };

    const beat = () => {
      const now = Date.now();
      const timeSinceLastBeat = now - lastBeatTime.current;

      const isStrongBeat = Math.random() < 0.1; // 10% chance of strong beat
      const isIrregular = Math.random() < 0.15; // 15% chance of irregularity
      const speedVariation = 0.2; // ±20% speed variation

      let nextBeatTime = baseSpeeds[pulseSpeed];
      if (isIrregular) {
        nextBeatTime *=
          1 + (Math.random() * speedVariation * 2 - speedVariation);
      }

      if (timeSinceLastBeat < nextBeatTime * 0.7) {
        nextBeatTime = nextBeatTime * 1.5;
      }

      setEcgPath(generateEcgPath(isStrongBeat));

      setPulse(true);
      setBeatCount(generatePulseNumber());

      const pulseDuration = isStrongBeat ? 400 : 300;
      setTimeout(() => setPulse(false), pulseDuration);

      lastBeatTime.current = now;
      clearInterval(beatInterval.current);
      beatInterval.current = setTimeout(beat, nextBeatTime);
    };

    lastBeatTime.current = Date.now();
    beat();

    return () => {
      clearInterval(beatInterval.current);
    };
  }, [animated, pulseSpeed]);

  const sizeConfig = {
    sm: {
      container: "w-10 h-10",
      icon: "w-5 h-5",
      text: "text-sm",
      sub: "text-xs",
    },
    md: {
      container: "w-14 h-14",
      icon: "w-7 h-7",
      text: "text-xl",
      sub: "text-sm",
    },
    lg: {
      container: "w-20 h-20",
      icon: "w-10 h-10",
      text: "text-2xl",
      sub: "text-base",
    },
    xl: {
      container: "w-28 h-28",
      icon: "w-14 h-14",
      text: "text-3xl",
      sub: "text-lg",
    },
  };

  const getTheme = () => {
    if (theme === "auto") return isDark ? "dark" : "light";
    return theme;
  };

  const themes = {
    light: {
      bg: "bg-white",
      border: "border-gray-200",
      shadow: "shadow-lg shadow-gray-200/50",
      pulse: "bg-rose-500",
      icon: "text-rose-600",
      text: "text-rose-600",
      brand: "text-rose-600",
      sub: "text-gray-600",
      glow: "shadow-rose-500/20",
    },
    dark: {
      bg: "bg-gray-900",
      border: "border-gray-700",
      shadow: "shadow-lg shadow-black/50",
      pulse: "bg-rose-400",
      icon: "text-rose-400",
      text: "text-white",
      brand: "text-rose-400",
      sub: "text-gray-300",
      glow: "shadow-rose-400/30",
    },
    medical: {
      bg: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-200 dark:border-rose-700",
      shadow: "shadow-lg shadow-rose-500/20",
      pulse: "bg-rose-500",
      icon: "text-rose-600 dark:text-rose-400",
      text: "text-rose-900 dark:text-rose-100",
      brand: "text-rose-600 dark:text-rose-400",
      sub: "text-rose-700 dark:text-rose-300",
      glow: "shadow-rose-500/30",
    },
    electric: {
      bg: "bg-slate-900",
      border: "border-rose-500/30",
      shadow: "shadow-lg shadow-rose-500/25",
      pulse: "bg-rose-400",
      icon: "text-rose-400",
      text: "text-white",
      brand: "text-rose-400",
      sub: "text-rose-200",
      glow: "shadow-rose-400/40",
    },
    minimal: {
      bg: "bg-gray-50 dark:bg-gray-800",
      border: "border-gray-300 dark:border-gray-600",
      shadow: "shadow-sm",
      pulse: "bg-rose-500 dark:bg-rose-400",
      icon: "text-rose-600 dark:text-rose-300",
      text: "text-gray-900 dark:text-white",
      brand: "text-rose-600 dark:text-rose-300",
      sub: "text-gray-500 dark:text-gray-400",
      glow: "shadow-rose-500/10",
    },
  };

  const currentTheme = themes[getTheme()];
  const config = sizeConfig[size];

  return (
    <div
      className="flex items-center gap-4"
      title="ECS HeartBeat - Cluster Monitor"
    >
      {/* Logo Container */}
      <div className="relative group">
        <div
          className={cn(
            config.container,
            currentTheme.bg,
            currentTheme.border,
            currentTheme.shadow,
            "rounded-xl",
            "border-2 flex items-center justify-center relative overflow-hidden",
            "transition-all duration-300 hover:scale-105",
            pulse ? `${currentTheme.glow} scale-105` : ""
          )}
        >
          <div
            className={cn(
              "absolute inset-0",
              currentTheme.pulse,
              "opacity-10 rounded-xl",
              "transition-all duration-500",
              pulse ? "scale-110 opacity-20" : "scale-100"
            )}
          />

          <div className={cn(config.icon, currentTheme.icon, "relative z-10")}>
            <ServerCog
              className={cn(
                "w-full h-full drop-shadow-sm",
                pulse ? "scale-110" : "scale-100",
                "transition-all duration-300"
              )}
            />
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <div
            className={cn(
              "font-bold",
              config.text,
              currentTheme.text,
              "flex items-center gap-2 leading-tight"
            )}
          >
            <span className={cn(currentTheme.brand, "font-extrabold")}>
              HeartBeat
            </span>
            {animated && (
              <Activity
                className={cn(
                  "w-4 h-4",
                  currentTheme.icon,
                  pulse ? "animate-spin" : "animate-bounce"
                )}
              />
            )}
          </div>

          <div className="flex items-center gap-3 -mt-0.5">
            <span className={cn(config.sub, currentTheme.sub, "font-medium")}>
              System Pulse
            </span>

            {animated && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5",
                    currentTheme.bg,
                    currentTheme.border,
                    "border rounded-full"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      pulse ? currentTheme.pulse : "bg-gray-400"
                    )}
                  />
                  <span
                    className={cn("text-xs", currentTheme.sub, "font-mono")}
                  >
                    {beatCount.toString().padStart(4, "0")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
