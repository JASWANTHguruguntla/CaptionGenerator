import React from 'react';

interface ControlsProps {
  tone: string;
  setTone: (tone: string) => void;
  platform: string;
  setPlatform: (platform: string) => void;
  disabled: boolean;
}

const TONES = ["Creative", "Funny", "Professional", "Inspirational", "Mysterious"];
const PLATFORMS = ["Instagram", "X", "Facebook", "LinkedIn"];

const Controls: React.FC<ControlsProps> = ({ tone, setTone, platform, setPlatform, disabled }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
      <div>
        <label htmlFor="tone-select" className="block text-sm font-medium text-slate-300 mb-1">
          Tone & Style
        </label>
        <select
          id="tone-select"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          disabled={disabled}
          className="w-full bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        >
          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Platform
        </label>
        <div className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-1 flex justify-between gap-1">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              disabled={disabled}
              className={`w-full text-center text-xs sm:text-sm rounded py-1 px-2 transition-colors duration-200 ${
                platform === p 
                ? 'bg-purple-600 text-white font-semibold shadow' 
                : 'bg-transparent text-slate-300 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Controls;