import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type Screen = 'proposal' | 'reaction' | 'splash' | 'menu' | 'memories' | 'music' | 'letter'
type MemoryView = 'note' | 'collage'

// Drop your own Bubu-Dudu / Milk-Mocha sticker files into public/stickers
// and your photos into public/photos. Everything used by the page is editable here.
const CONFIG = {
  ASSETS: {
    stickers: {
      giftBoxSticker: '/stickers/gift-box.gif',
      sadPandaSticker: '/stickers/sad-panda.gif',
      birthdayCakeSticker: '/stickers/birthday-cake.gif',
      peekingBearSticker: '/stickers/peeking-bear.png',
      cameraIcon: '/stickers/camera.png',
      envelopeIcon: '/stickers/envelope.png',
      cassetteIcon: '/stickers/cassette.png',
      bubuDuduBox: '/stickers/bubu-dudu-box.png',
      bubuDuduPhone: '/stickers/bubu-dudu-phone.png',
      bubuDuduCake: '/stickers/bubu-dudu-cake.png',
      duduHitsBubuSticker: '/stickers/dudu-hits-bubu.gif',
      noReactionVideo: '/stickers/dudu-no-reaction.mp4',
    },
    photos: [
      '/photos/human-1.jpeg',
      '/photos/human-2.jpeg',
      '/photos/human-3.jpeg',
      '/photos/human-4.jpeg',
      '/photos/human-5.jpeg',
      '/photos/human-15.jpeg',
      '/photos/human-8.jpeg',
      '/photos/human-9.jpeg',
      '/photos/human-10.jpeg',
      '/photos/human-11.jpeg',
      '/photos/human-12.jpeg',
      '/photos/human-13.jpeg',
      '/photos/human-14.jpeg',
      '/photos/human-15.jpeg',
    ],
  },
  memoryCoverPhoto: '/photos/human-15.jpeg',
  letterPhoto: '/photos/human-14.jpeg',
  birthdaySongVideo: '/media/birthday-song.mp4',
  birthdaySongLabel: 'Happy Birthday, my love ♡',
  birthdayMessage:
    'Happy birthday to my favorite person. Thank you for making ordinary days feel like tiny celebrations. I hope this year brings you soft mornings, loud laughs, and every sweet little thing your heart has been waiting for. Keep shining, birthday cutie!',
  sweetLetter:
    'You are my favorite kind of magic: warm, silly, kind, and impossible not to love. Every memory with you feels like a little polaroid I want to keep forever. On your birthday, I hope you remember how deeply you are loved — today, tomorrow, and in all the tiny in-between moments.',
}

const rotations = [-5, 4, -3, 6, -7, 3, -4, 5, -2]
const captions = ['How cute!', 'my happy place', 'birthday energy', 'little sunshine', 'forever us', 'sweet moment', 'love this one', 'best day', 'cutie pie']
const heartPhotoPositions: Array<[number, number]> = [
  [2, 1], [4, 1],
  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
  [2, 4], [3, 4],
]
const heartArrivals = [
  [-90, -100, -18], [80, -110, 15], [-130, -30, -22], [-70, -150, 12], [0, -120, -10], [75, -145, 18], [135, -35, 24],
  [-150, 30, -15], [-90, 110, 12], [0, 145, -14], [85, 110, 18], [150, 30, 20], [-90, 155, -20], [0, 180, 16], [100, 155, -18], [0, 250, 8],
]

function Sticker({
  src,
  alt,
  className = '',
  fallback = '♡',
  fallbackSrc,
}: {
  src: string
  alt: string
  className?: string
  fallback?: string
  fallbackSrc?: string
}) {
  const [failed, setFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  if (failed && fallbackSrc && !fallbackFailed) {
    return <img className={`drop-shadow-md ${className}`} src={fallbackSrc} alt={alt} onError={() => setFallbackFailed(true)} />
  }

  if (failed) {
    return (
      <div className={`sticker-fallback drop-shadow-md ${className}`} aria-label={alt} role="img">
        <span>{fallback}</span>
      </div>
    )
  }

  return <img className={`drop-shadow-md ${className}`} src={src} alt={alt} onError={() => setFailed(true)} />
}

function StickerVideo({
  src,
  fallbackSrc,
  alt,
  className = '',
}: {
  src: string
  fallbackSrc: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <Sticker src={fallbackSrc} alt={alt} className={className} fallback="♡" />
  }

  return (
    <video
      className={`drop-shadow-md ${className}`}
      src={src}
      title={alt}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      onError={() => setFailed(true)}
    />
  )
}

const happyBirthdayNotes = {
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
} as const

const happyBirthdayMelody: Array<[keyof typeof happyBirthdayNotes | 'rest', number]> = [
  ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.5], ['G4', 0.5], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.5], ['F5', 0.5], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2],
]

function AmbientAudio({ shouldPlay, onActivate }: { shouldPlay: boolean; onActivate: () => void }) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const loopTimerRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const getAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return null
    audioContextRef.current = new AudioContextConstructor()
    return audioContextRef.current
  }

  const scheduleMelody = (context: AudioContext) => {
    const beat = 0.34
    let cursor = context.currentTime + 0.06

    happyBirthdayMelody.forEach(([note, beats]) => {
      const duration = beats * beat
      if (note !== 'rest') {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const end = cursor + duration
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(happyBirthdayNotes[note], cursor)
        gain.gain.setValueAtTime(0.0001, cursor)
        gain.gain.exponentialRampToValueAtTime(0.16, cursor + 0.025)
        gain.gain.exponentialRampToValueAtTime(0.0001, Math.max(cursor + 0.06, end - 0.04))
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(cursor)
        oscillator.stop(end)
      }
      cursor += duration
    })

    return cursor - context.currentTime
  }

  const playMelody = async () => {
    const context = getAudioContext()
    if (!context) return

    try {
      await context.resume()
      playingRef.current = true
      setIsPlaying(true)
      const duration = scheduleMelody(context)
      loopTimerRef.current = window.setTimeout(() => {
        if (playingRef.current) void playMelody()
      }, Math.max(100, duration * 1000 - 100))
    } catch {
      playingRef.current = false
      setIsPlaying(false)
    }
  }

  const stopMelody = async () => {
    playingRef.current = false
    if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current)
    loopTimerRef.current = null
    if (audioContextRef.current?.state === 'running') await audioContextRef.current.suspend()
    setIsPlaying(false)
  }

  useEffect(() => {
    if (shouldPlay && !playingRef.current) void playMelody()
  }, [shouldPlay])

  useEffect(() => () => {
    playingRef.current = false
    if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current)
    void audioContextRef.current?.close()
  }, [])

  const toggleAudio = async () => {
    onActivate()
    if (playingRef.current) {
      await stopMelody()
    } else {
      await playMelody()
    }
  }

  return (
    <button className={`sound-button ${isPlaying ? 'sound-button-on' : ''}`} type="button" onClick={toggleAudio}>
      <span aria-hidden="true">{isPlaying ? '♫' : '♪'}</span>
      {isPlaying ? 'happy birthday is on' : 'play happy birthday'}
    </button>
  )
}

function SparkleField() {
  const stars = [
    ['✦', 'left-[6%] top-[12%] text-[#ef9bb0] text-2xl', 'float-slow'],
    ['✧', 'left-[16%] top-[76%] text-[#f7b5c4] text-4xl', 'float-delay'],
    ['✦', 'right-[12%] top-[17%] text-[#efa4b6] text-3xl', 'float-fast'],
    ['♡', 'right-[7%] top-[72%] text-[#ef9bb0] text-3xl', 'float-slow'],
    ['·', 'right-[28%] top-[9%] text-[#f3b3c0] text-5xl', 'float-delay'],
    ['✧', 'left-[38%] bottom-[8%] text-[#efa4b6] text-2xl', 'float-fast'],
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map(([symbol, placement, animation], index) => (
        <span key={`${symbol}-${index}`} className={`absolute ${placement} ${animation} font-display`}>
          {symbol}
        </span>
      ))}
    </div>
  )
}

function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  ariaLabel,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'soft' | 'round'
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      className={`kawaii-button ${variant === 'soft' ? 'kawaii-button-soft' : ''} ${variant === 'round' ? 'kawaii-button-round' : ''} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  )
}

function PageShell({ children, screen }: { children: ReactNode; screen: Screen }) {
  return (
    <main className={`app-shell stripe-backdrop screen-${screen}`}>
      <SparkleField />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-5 pb-8 pt-5 sm:px-8">
        {children}
      </div>
    </main>
  )
}

function TopBar({ onBack, label }: { onBack?: () => void; label?: string }) {
  return (
    <header className="flex items-center justify-between gap-4">
      {onBack ? (
        <button className="back-button" type="button" onClick={onBack} aria-label="Go back to the menu">
          <span aria-hidden="true">←</span> back
        </button>
      ) : (
        <div className="tiny-label">a little birthday adventure</div>
      )}
      {label && <div className="tiny-label text-right">{label}</div>}
    </header>
  )
}

function ProposalScreen({ go, onYes }: { go: (screen: Screen) => void; onYes: () => void }) {
  return (
    <PageShell screen="proposal">
      <TopBar />
      <section className="flex flex-1 items-center justify-center py-10">
        <div className="heart-stage relative flex w-full max-w-[720px] flex-col items-center justify-center px-6 py-14 text-center sm:px-16">
          <div className="heart-glow" aria-hidden="true">♥</div>
          <Sticker
            src={CONFIG.ASSETS.stickers.bubuDuduBox}
            alt="Bubu and Dudu sitting together"
            fallbackSrc={CONFIG.ASSETS.stickers.bubuDuduCake}
            fallback="♡"
            className="bubu-sticker relative z-10 mb-4 h-44 w-44 object-contain mix-blend-multiply transition-transform duration-300 hover:scale-110 sm:h-52 sm:w-52"
          />
          <p className="eyebrow relative z-10">for the birthday cutie</p>
          <h1 className="relative z-10 mt-3 max-w-[600px] font-rounded text-4xl font-semibold leading-tight text-cocoa sm:text-6xl">
            I made something special for u, <span className="text-coral">do u wanna see it?</span>
          </h1>
          <div className="relative z-10 mt-9 flex flex-wrap justify-center gap-4">
            <Button onClick={() => { onYes(); go('splash') }}>YES ♡</Button>
            <Button onClick={() => go('reaction')} variant="soft">
              NO
            </Button>
          </div>
        </div>
      </section>
      <div className="mx-auto text-center text-xs font-medium tracking-[0.18em] text-cocoa/50">tap a button, birthday baby</div>
    </PageShell>
  )
}

function ReactionScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PageShell screen="reaction">
      <TopBar />
      <section className="flex flex-1 items-center justify-center py-10">
        <div className="paper-card flex w-full max-w-[610px] flex-col items-center px-6 py-12 text-center sm:px-16">
          <div className="mb-5 rounded-full bg-[#fff2f1] p-5 ring-8 ring-white/70">
            <StickerVideo
              src={CONFIG.ASSETS.stickers.noReactionVideo}
              fallbackSrc={CONFIG.ASSETS.stickers.bubuDuduPhone}
              alt="Dudu playfully teasing Bubu"
              className="bubu-sticker h-40 w-40 object-contain transition-transform duration-300 hover:scale-110 sm:h-48 sm:w-48"
            />
          </div>
          <p className="eyebrow">tiny technical difficulty</p>
          <h1 className="mt-3 font-rounded text-4xl font-semibold text-cocoa sm:text-5xl">Why did u click no!?</h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-cocoa/70">The birthday magic is waiting right here. Try again and I promise it is worth it ♡</p>
          <Button onClick={() => go('proposal')} className="mt-8">
            TRY AGAIN
          </Button>
        </div>
      </section>
    </PageShell>
  )
}

function SplashScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PageShell screen="splash">
      <TopBar label="the sweetest day" />
      <section className="flex flex-1 items-center justify-center py-10">
        <div className="relative flex w-full max-w-[880px] flex-col items-center text-center">
          <div className="relative z-10 mb-[-18px] flex items-center gap-4 text-3xl text-coral sm:text-5xl" aria-hidden="true">
            <span className="float-delay">♡</span>
            <span className="text-5xl sm:text-7xl">♥</span>
            <span className="float-fast">♡</span>
          </div>
          <h1 className="relative z-10 font-display text-6xl leading-[1.05] text-coral sm:text-8xl">Happy Birthday</h1>
          <div className="splash-cake absolute left-[5%] top-[40%] hidden -rotate-12 sm:block">
            <Sticker
              src={CONFIG.ASSETS.stickers.bubuDuduCake}
              alt="Bubu and Dudu celebrating with a birthday cake"
              fallbackSrc={CONFIG.ASSETS.stickers.bubuDuduBox}
              fallback="♡"
              className="bubu-sticker h-36 w-36 object-contain mix-blend-multiply transition-transform duration-300 hover:scale-110 md:h-48 md:w-48"
            />
          </div>
          <p className="mt-5 max-w-xl font-rounded text-lg font-medium leading-8 text-cocoa/75 sm:text-xl">
            today is all about celebrating the softest, funniest, most lovable you.
          </p>
          <Button onClick={() => go('menu')} variant="round" className="mt-10">
            CLICK ME
          </Button>
          <div className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-cocoa/45">your special surprise is inside</div>
        </div>
      </section>
    </PageShell>
  )
}

function MenuScreen({ go }: { go: (screen: Screen) => void }) {
  const menuItems = [
    { title: 'memories', note: 'little moments', image: CONFIG.ASSETS.stickers.cameraIcon, fallback: '📷', screen: 'memories' as Screen, tone: 'yellow' },
    { title: 'sweet letter', note: 'open when smiling', image: CONFIG.ASSETS.stickers.envelopeIcon, fallback: '💌', screen: 'letter' as Screen, tone: 'purple' },
    { title: 'our soundtrack', note: 'press play', image: CONFIG.ASSETS.stickers.cassetteIcon, fallback: '📼', screen: 'music' as Screen, tone: 'pink' },
  ]

  return (
    <PageShell screen="menu">
      <TopBar label="choose a little surprise" />
      <section className="flex flex-1 flex-col justify-center py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">a tiny menu made with love</p>
          <h1 className="mt-3 font-rounded text-4xl font-semibold text-cocoa sm:text-6xl">CLICK ON ANY ITEM TO OPEN</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-cocoa/65">Three little doors, one very special birthday person. Pick whichever feels cutest right now.</p>
        </div>
        <div className="mx-auto mt-10 grid w-full max-w-5xl gap-5 md:grid-cols-3">
          {menuItems.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => go(item.screen)}
              className={`menu-card menu-card-${item.tone} group ${index === 1 ? 'md:translate-y-5' : ''}`}
            >
              <span className="menu-card-shine" aria-hidden="true" />
              <Sticker
                src={item.image}
                alt={`${item.title} sticker`}
                fallback={item.fallback}
                className="relative z-10 h-36 w-36 object-contain transition-transform duration-300 group-hover:scale-110 sm:h-44 sm:w-44"
              />
              <span className="relative z-10 mt-3 font-rounded text-2xl font-semibold text-cocoa">{item.title}</span>
              <span className="relative z-10 mt-1 text-sm font-medium text-cocoa/55">{item.note}</span>
              <span className="menu-card-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>
      <div className="mx-auto text-center text-xs font-medium tracking-[0.18em] text-cocoa/50">pick one, my love ♡</div>
    </PageShell>
  )
}

function PhotoFrame({ className = '', photo = CONFIG.ASSETS.photos[0], alt = 'Birthday memory' }: { className?: string; photo?: string; alt?: string }) {
  return (
    <div className={`scallop-frame ${className}`}>
      <div className="scallop-inner">
        <img src={photo} alt={alt} className="h-full w-full bg-[#f3e9df] object-contain" />
      </div>
      <span className="frame-tape" aria-hidden="true" />
      <span className="frame-heart" aria-hidden="true">♥</span>
    </div>
  )
}

function MemoriesScreen({ go }: { go: (screen: Screen) => void }) {
  const [view, setView] = useState<MemoryView>('note')
  const heartPhotos = useMemo(() => Array.from({ length: heartPhotoPositions.length }, (_, index) => CONFIG.ASSETS.photos[index % CONFIG.ASSETS.photos.length]), [])

  return (
    <PageShell screen="memories">
      <TopBar onBack={() => go('menu')} label="memories & collage" />
      <section className="flex flex-1 flex-col justify-center py-8">
        {view === 'note' ? (
          <div className="memory-layout mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <p className="eyebrow">a pocket full of memories</p>
              <h1 className="mt-2 font-display text-5xl text-coral sm:text-6xl">To my love</h1>
              <PhotoFrame photo={CONFIG.memoryCoverPhoto} className="mt-7 h-[305px] w-[252px] sm:h-[355px] sm:w-[292px]" />
              <p className="mt-5 max-w-sm text-sm leading-6 text-cocoa/60">same silly hearts, new little memories, forever and ever.</p>
            </div>
            <div className="relative">
              <article className="message-card">
                <div className="message-card-top">
                  <span>for: my favorite human</span>
                  <span>♡</span>
                </div>
                <h2 className="mt-6 font-rounded text-3xl font-semibold text-cocoa">a birthday note</h2>
                <div className="message-scroll mt-5 max-h-[220px] overflow-y-auto pr-2 text-base leading-8 text-cocoa/75">
                  <p className="whitespace-pre-line">{CONFIG.birthdayMessage}</p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-coral/15 pt-4 text-sm font-semibold text-coral">
                  <span>made with every little bit of love</span>
                  <span className="text-2xl">♥</span>
                </div>
              </article>
              <Button variant="round" onClick={() => setView('collage')} className="absolute -bottom-7 -right-1 sm:-right-6" ariaLabel="Open the photo collage">
                →
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">our memories, in a heart</p>
                <h1 className="mt-2 font-display text-5xl text-coral sm:text-6xl">all my heart</h1>
              </div>
              <p className="max-w-xs text-sm leading-6 text-cocoa/60 sm:text-right">watch our favorite moments fly in and settle where they belong.</p>
            </div>
            <div className="heart-collage-wrap">
              <div className="heart-photo-grid" aria-label="A heart-shaped collage of our memories">
                {heartPhotos.map((photo, index) => {
                  const [column, row] = heartPhotoPositions[index]
                  const [fromX, fromY, fromRotation] = heartArrivals[index]
                  return (
                  <div
                    key={`${photo}-${index}`}
                    className="heart-photo-card"
                    style={{
                      gridColumn: column,
                      gridRow: row,
                      '--from-x': `${fromX}px`,
                      '--from-y': `${fromY}px`,
                      '--from-rotation': `${fromRotation}deg`,
                      '--rest-rotation': `${rotations[index % rotations.length]}deg`,
                      '--delay': `${index * 85}ms`,
                    } as CSSProperties}
                  >
                    <img src={photo} alt={`Birthday memory ${index + 1}`} />
                    <span>{index === 13 ? '♡' : captions[index % captions.length]}</span>
                  </div>
                  )
                })}
              </div>
              <Sticker
                src={CONFIG.ASSETS.stickers.peekingBearSticker}
                alt="A peeking bear sticker"
                fallback="🧸"
                className="peeking-bear peeking-bear-left h-28 w-28 object-contain sm:h-40 sm:w-40"
              />
              <Sticker
                src={CONFIG.ASSETS.stickers.peekingBearSticker}
                alt="A peeking bear sticker"
                fallback="🧸"
                className="peeking-bear peeking-bear-right h-28 w-28 -scale-x-100 object-contain sm:h-40 sm:w-40"
              />
              <span className="heart-collage-center" aria-hidden="true">♥</span>
            </div>
            <div className="mt-8 flex justify-center">
              <Button onClick={() => go('menu')} variant="soft">← back to the menu</Button>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  )
}

function MusicScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PageShell screen="music">
      <TopBar onBack={() => go('menu')} label="our soundtrack" />
      <section className="flex flex-1 items-center justify-center py-9">
        <div className="music-panel grid w-full max-w-5xl gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative flex min-h-[390px] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#ead8fb] px-6 py-9 text-center">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/35" />
            <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#d5b8f0]/45" />
            <div className="music-confetti music-confetti-one" aria-hidden="true">✦</div>
            <div className="music-confetti music-confetti-two" aria-hidden="true">♡</div>
            <div className="music-confetti music-confetti-three" aria-hidden="true">✧</div>
            <div className="music-disc" aria-hidden="true"><span>♡</span></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-cocoa/50">press play, birthday baby</p>
            <h1 className="mt-3 font-rounded text-4xl font-semibold text-cocoa">{CONFIG.birthdaySongLabel}</h1>
            <p className="mt-2 font-display text-2xl text-coral">a joyful little birthday tune</p>
            <div className="music-wave mt-6" aria-label="Sound is playing">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <Sticker
              src={CONFIG.ASSETS.stickers.bubuDuduCake}
              alt="Bubu and Dudu celebrating a birthday"
              fallbackSrc={CONFIG.ASSETS.stickers.bubuDuduBox}
              fallback="♡"
              className="bubu-sticker absolute -bottom-5 -left-3 h-36 w-36 object-contain mix-blend-multiply sm:h-44 sm:w-44"
            />
          </div>
          <div className="joyful-note-card relative flex min-h-[390px] flex-col justify-center overflow-hidden rounded-[28px] px-7 py-9 sm:px-10">
            <span className="joyful-note-sticker" aria-hidden="true">🎈</span>
            <p className="eyebrow">background music for your birthday</p>
            <h2 className="mt-3 max-w-md font-display text-5xl leading-tight text-coral sm:text-6xl">Make a wish &amp; smile</h2>
            <p className="mt-5 max-w-md text-base leading-8 text-cocoa/70">The happiest little tune is playing while you look through our memories. Tap the music pill anytime to pause or play it.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-cocoa/65">
              <span className="music-chip">♡ birthday joy</span>
              <span className="music-chip">✦ made for you</span>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function LetterScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <PageShell screen="letter">
      <TopBar onBack={() => go('menu')} label="open with a smile" />
      <section className="flex flex-1 items-center justify-center py-8">
        <div className="letter-layout grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex flex-col items-center justify-center text-center">
            <PhotoFrame photo={CONFIG.letterPhoto} alt="A birthday celebration memory" className="h-[340px] w-[280px] rotate-[-4deg] sm:h-[400px] sm:w-[330px]" />
            <div className="speech-bubble absolute -right-1 top-[4%] rotate-6 sm:right-[4%]">
              I love you!
              <span aria-hidden="true">♥</span>
            </div>
            <Sticker
              src={CONFIG.ASSETS.stickers.peekingBearSticker}
              alt="A peeking bear sticker"
              fallback="🧸"
              className="absolute -bottom-8 -left-1 h-32 w-32 object-contain sm:-left-8 sm:h-44 sm:w-44"
            />
          </div>
          <article className="letter-paper">
            <p className="eyebrow">sealed with a kiss</p>
            <h1 className="mt-3 font-display text-5xl leading-tight text-coral sm:text-7xl">The sweet Letter</h1>
            <div className="letter-rule" aria-hidden="true"><span>♡</span></div>
            <div className="letter-scroll mt-5 max-h-[290px] overflow-y-auto pr-3 text-base leading-8 text-cocoa/75 sm:max-h-[330px]">
              <p className="whitespace-pre-line">{CONFIG.sweetLetter}</p>
              <p className="mt-7 font-display text-3xl text-coral">With love, your favorite person ♡</p>
            </div>
            <div className="mt-7 text-right text-xs font-bold uppercase tracking-[0.2em] text-cocoa/40">always yours</div>
          </article>
        </div>
      </section>
    </PageShell>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('proposal')
  const [musicRequested, setMusicRequested] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [screen])

  const go = (nextScreen: Screen) => setScreen(nextScreen)

  let content: ReactNode

  switch (screen) {
    case 'reaction':
      content = <ReactionScreen go={go} />
      break
    case 'splash':
      content = <SplashScreen go={go} />
      break
    case 'menu':
      content = <MenuScreen go={go} />
      break
    case 'memories':
      content = <MemoriesScreen go={go} />
      break
    case 'music':
      content = <MusicScreen go={go} />
      break
    case 'letter':
      content = <LetterScreen go={go} />
      break
    case 'proposal':
    default:
      content = <ProposalScreen go={go} onYes={() => setMusicRequested(true)} />
      break
  }

  return (
    <>
      <AmbientAudio shouldPlay={musicRequested} onActivate={() => setMusicRequested(true)} />
      {content}
    </>
  )
}
