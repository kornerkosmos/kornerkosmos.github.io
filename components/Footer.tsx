import React from 'react';
import { siPixiv, siX, siUnsplash } from 'simple-icons';

const SimpleIcon: React.FC<{ icon: { path: string; viewBox?: string }; size?: number }> = ({ icon, size = 16 }) => (
  <svg width={size} height={size} viewBox={icon.viewBox ?? '0 0 24 24'} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d={icon.path} />
  </svg>
);

const links = [
  { icon: siPixiv,   label: 'Pixiv',   url: 'https://www.pixiv.net/users/37046952' },
  { icon: siX,       label: 'X',       url: 'https://x.com/Korner_Kosmos' },
  { icon: siUnsplash, label: 'Unsplash', url: 'https://unsplash.com/@korner_kosmos' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        {links.map(({ icon, label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="opacity-40 hover:opacity-100 transition-opacity duration-300 text-black"
          >
            <SimpleIcon icon={icon} size={16} />
          </a>
        ))}
      </div>

      <p className="font-mono text-[10px] text-black opacity-30 select-none">
        © {new Date().getFullYear()} Korner Kosmos
      </p>
    </footer>
  );
};
