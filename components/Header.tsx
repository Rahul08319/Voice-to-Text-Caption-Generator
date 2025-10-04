
import React from 'react';

export const Header: React.FC = () => (
  <header className="text-center py-4">
    <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight">
      Voice-to-Text Caption Generator
    </h1>
    <p className="text-lg md:text-xl text-gray-400 mt-2">
      Real-time speech recognition powered by Gemini
    </p>
  </header>
);
