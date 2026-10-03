import { useState, useEffect, useRef } from 'react';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.3; // Set background volume to 30% so it's pleasant, not overwhelming

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Modern browsers block autoplay until the user interacts with the page.
    // We will attempt to play it immediately, but if it fails, we wait for a click.
    const attemptPlay = () => {
      audio.play().catch((error) => {
        console.log("Autoplay prevented by browser. Waiting for user interaction.", error);
      });
    };

    attemptPlay();

    // Listen for the first click anywhere on the document to start playing if it was blocked
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        attemptPlay();
        setHasInteracted(true);
        // Remove listener after first interaction
        document.removeEventListener('click', handleFirstInteraction);
      }
    };

    document.addEventListener('click', handleFirstInteraction);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [hasInteracted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/bgm.mp3" loop />
      
      <button 
        onClick={togglePlay}
        className="glass-panel"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid var(--color-primary)',
          color: 'var(--color-primary)',
          background: 'rgba(26, 18, 16, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title={isPlaying ? "Pause Music" : "Play Music"}
      >
        {isPlaying ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
    </>
  );
};

export default AudioPlayer;
