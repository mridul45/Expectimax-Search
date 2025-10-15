/** ======================== Tailwind helpers ======================== **/
export function valueClasses(v) {
    if (v >= 2048) return "from-emerald-400/60 to-violet-400/40 text-xl";
    if (v >= 1024) return "from-violet-400/50 to-cyan-400/30 text-xl";
    if (v >= 512)  return "from-violet-400/45 to-cyan-400/25 text-[1.15rem]";
    if (v >= 256)  return "from-violet-400/40 to-cyan-400/20 text-[1.15rem]";
    if (v >= 128)  return "from-violet-400/35 to-cyan-400/18";
    if (v >= 64)   return "from-cyan-300/40 to-indigo-400/20";
    if (v >= 32)   return "from-cyan-300/35 to-indigo-400/18";
    if (v >= 16)   return "from-cyan-300/30 to-indigo-400/16";
    if (v >= 8)    return "from-cyan-300/26 to-indigo-400/14";
    if (v >= 4)    return "from-cyan-300/22 to-indigo-400/12";
    return "from-cyan-300/18 to-indigo-400/10";
  }