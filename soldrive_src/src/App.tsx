import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Settings, 
  X, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  LayoutDashboard,
  Smartphone,
  Plus,
  Trash2,
  Video,
  ImageIcon,
  GripVertical,
  Sliders,
  Monitor,
  LogIn,
  Loader2,
  UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from "@/lib/utils";
import { db, auth, loginWithGoogle, OperationType, handleFirestoreError } from './firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleGenerativeAI } from "@google/genai";

// --- Types ---

interface SlideData {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'gif';
  slideType?: 'photo' | 'video';
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  textContent: string;
  deeperDiveTitle?: string;
  deeperDiveImageUrl?: string;
  deeperDiveMediaType?: 'image' | 'video' | 'gif' | 'youtube';
  deeperDiveContent?: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

interface ContentData {
  globalVoiceId: string;
  slides: SlideData[];
}

const DEFAULT_CONTENT: ContentData = {
  globalVoiceId: '21m00Tcm4TlvDq8ikWAM', // Example ElevenLabs voice
  slides: [
    {
      id: 'slide-1',
      mediaUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
      mediaType: 'image',
      slideType: 'photo',
      aspectRatio: '1:1',
      textContent: 'Welcome to this interactive learning experience.',
      deeperDiveTitle: 'Getting Started',
      deeperDiveContent: 'This is where you can add more detailed information, links, and resources for users who want to dive deeper into the topic.'
    }
  ]
};

// Add Gemini config near the top
const geminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
};

// --- Components ---

const MobileFrame = ({ 
  children, 
  onToggleAdmin,
  isLandscape = false
}: { 
  children: React.ReactNode, 
  onToggleAdmin: () => void,
  isLandscape?: boolean
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4 overflow-hidden">
      {/* Admin Toggle */}
      <div className="fixed top-4 right-4 z-[200]">
        <Button 
          onClick={onToggleAdmin}
          className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg rounded-full px-6 border border-neutral-200 font-bold"
        >
          <Settings className="mr-2 h-4 w-4" />
          Admin Dashboard
        </Button>
      </div>

      <motion.div 
        className="relative w-full max-w-[400px] aspect-[9/19] bg-white rounded-[3rem] shadow-2xl border-[8px] border-neutral-900 overflow-hidden flex flex-col transition-all duration-700 ease-in-out"
        animate={{ 
          rotate: isLandscape ? -90 : 0,
          scale: isLandscape ? 0.85 : 1,
          x: isLandscape ? 0 : 0
        }}
      >
        {/* Hardware Elements */}
        <div className="absolute top-0 inset-x-0 h-6 flex items-center justify-center z-50">
          <div className="w-1/3 h-6 bg-neutral-900 rounded-b-3xl" />
        </div>
        
        {/* iOS Status Bar */}
        <div className="absolute top-0 inset-x-0 h-10 px-6 flex items-center justify-between z-40 text-neutral-900">
          <span className="text-[11px] font-bold tracking-tight">{time}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end h-2.5">
              <div className="w-0.5 h-1 bg-neutral-900 rounded-sm" />
              <div className="w-0.5 h-1.5 bg-neutral-900 rounded-sm" />
              <div className="w-0.5 h-2 bg-neutral-900 rounded-sm" />
              <div className="w-0.5 h-2.5 bg-neutral-900 rounded-sm" />
            </div>
            <div className="w-3.5 h-2.5 border border-neutral-900 rounded-sm flex p-[1px] relative">
              <div className="bg-neutral-900 w-full h-full rounded-sm" />
              <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-[2px] h-1 bg-neutral-900 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={cn(
          "flex-1 relative flex flex-col bg-white",
          !isLandscape && "pt-12 pb-8" // Add padding only in portrait mode to account for status bar and home indicator
        )}>
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="w-1/3 h-1 bg-neutral-200 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
};

const LessonView = ({ 
  content, 
  onNavigate, 
  user,
  isLandscape,
  onToggleLandscape,
  currentSlideIndex,
  setCurrentSlideIndex
}: { 
  content: ContentData, 
  onNavigate: (view: string) => void,
  user: User | null,
  isLandscape: boolean,
  onToggleLandscape: () => void,
  currentSlideIndex: number,
  setCurrentSlideIndex: (index: number) => void
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const slide = content.slides[currentSlideIndex];
  const isVideo = slide?.mediaType === 'video';
  const isPhoto = slide?.slideType === 'photo';

  const getAspectRatioClass = () => {
    if (!slide) return 'aspect-square';
    if (slide.slideType === 'video') return 'aspect-[9/16]'; // Video is always full bleed
    
    switch (slide.aspectRatio) {
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': 
      default: return 'aspect-square';
    }
  };

  useEffect(() => {
    setAudioUrl(null);
    setIsPlaying(false);
    setShowFullText(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [currentSlideIndex]);

  const generateAudio = async () => {
    if (!slide) return;
    setIsGeneratingAudio(true);
    
    try {
      const voiceId = slide.voiceId || content.globalVoiceId;
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: slide.textContent,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: slide.stability || 0.5,
            similarity_boost: slide.similarityBoost || 0.75,
            style: slide.style || 0.0,
            use_speaker_boost: slide.useSpeakerBoost !== false
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate audio');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsPlaying(true);
      if (videoRef.current) videoRef.current.play();
    } catch (error) {
      console.error("Error generating audio:", error);
      // Fallback
      setIsPlaying(true);
      if (videoRef.current) videoRef.current.play();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
      videoRef.current?.pause();
    } else {
      if (!audioUrl && slide) {
        generateAudio();
      } else {
        setIsPlaying(true);
        audioRef.current?.play();
        videoRef.current?.play();
      }
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < content.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      // End of story
      setCurrentSlideIndex(0); // Loop for now
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  if (!slide) return null;

  if (isLandscape) {
    return (
      <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center z-[100]">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-6 left-6 z-50 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full"
          onClick={onToggleLandscape}
        >
          <X size={24} />
        </Button>
        {isVideo ? (
          <video 
            ref={videoRef}
            src={slide.mediaUrl} 
            className="w-full h-full object-cover"
            playsInline
            loop
          />
        ) : (
          <img 
            src={slide.mediaUrl} 
            alt="Content" 
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {/* Dynamic Header */}
      <div className="absolute top-0 inset-x-0 p-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {content.slides.map((_, idx) => (
            <div 
              key={idx} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm",
                idx === currentSlideIndex 
                  ? "w-8 bg-white/90 shadow-sm" 
                  : idx < currentSlideIndex
                    ? "w-4 bg-white/60"
                    : "w-2 bg-black/20"
              )}
            />
          ))}
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm pointer-events-auto">
            <span className="text-[10px] font-bold text-neutral-600 truncate max-w-[80px]">
              {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
            </span>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-[8px] font-bold text-orange-600">
                  {user.displayName?.[0] || user.email?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Section */}
      <div className="relative w-full bg-neutral-100 flex-shrink-0 group">
        <div className={cn(
          "w-full overflow-hidden flex items-center justify-center transition-all duration-500",
          getAspectRatioClass()
        )}>
          {isVideo ? (
            <video 
              ref={videoRef}
              src={slide.mediaUrl} 
              className="w-full h-full object-cover"
              playsInline
              loop
            />
          ) : (
            <img 
              src={slide.mediaUrl} 
              alt="Content" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Media Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 pointer-events-none" />
          
          {/* Main Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence>
              {!isPlaying && !isGeneratingAudio && (
                <motion.button 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={handlePlayPause}
                  className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all pointer-events-auto shadow-2xl border border-white/30"
                >
                  <Play size={32} className="ml-2 fill-current" />
                </motion.button>
              )}
              {isGeneratingAudio && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl border border-white/30"
                >
                  <RefreshCw className="animate-spin" size={32} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col bg-white relative -mt-6 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-10">
        
        {/* Navigation Overlays (Invisible click areas) */}
        <div className="absolute inset-y-0 left-0 w-1/4 z-20" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/4 z-20" onClick={handleNext} />

        {/* Text Content */}
        <div className="p-8 pb-4 relative z-30 pointer-events-none">
          <div className={cn(
            "relative",
            !showFullText && "max-h-[160px] overflow-hidden"
          )}>
            <p className="text-xl leading-relaxed text-neutral-800 font-medium">
              {slide.textContent}
            </p>
            {!showFullText && slide.textContent.length > 150 && (
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
          
          {slide.textContent.length > 150 && (
            <button 
              onClick={() => setShowFullText(!showFullText)}
              className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-2 hover:text-neutral-600 transition-colors pointer-events-auto flex items-center gap-1"
            >
              {showFullText ? 'Show Less' : 'Read More'}
              <ChevronDown size={14} className={cn("transition-transform", showFullText && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="mt-auto p-6 flex flex-col gap-4 relative z-30 pointer-events-none">
          {/* Contextual Actions */}
          <div className="flex gap-2 w-full pointer-events-auto">
            {slide.deeperDiveTitle && (
              <Button 
                onClick={(e) => { e.stopPropagation(); onNavigate('more'); }}
                className="flex-1 bg-neutral-900 text-white rounded-2xl h-14 font-bold text-sm shadow-xl shadow-neutral-200 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <Sparkles className="mr-2 h-5 w-5 text-orange-400" />
                {slide.deeperDiveTitle}
              </Button>
            )}
          </div>
          
          {/* Navigation/Tools */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); onNavigate('notes'); }}
                className="rounded-full h-12 w-12 border-neutral-200 text-neutral-600 shadow-sm"
              >
                <MessageSquare size={20} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); onNavigate('connect'); }}
                className="rounded-full h-12 w-12 border-neutral-200 text-neutral-600 shadow-sm"
              >
                <MoreHorizontal size={20} />
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
                {currentSlideIndex + 1} of {content.slides.length}
              </span>
              <Button 
                onClick={handleNext}
                className="rounded-full h-12 w-12 bg-orange-50 text-orange-600 hover:bg-orange-100"
              >
                <ChevronRight size={24} />
              </Button>
            </div>
          </div>
        </div>

        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden" 
          />
        )}
      </div>
    </div>
  );
};

const NotesView = ({ onBack, user }: { onBack: () => void, user: User | null }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    if (!user) return;
    const loadNote = async () => {
      const docRef = doc(db, `users/${user.uid}/notes/main`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNote(docSnap.data().content || '');
      }
    };
    loadNote();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, `users/${user.uid}/notes/main`), {
        content: note,
        updatedAt: new Date().toISOString()
      });
      setSavedStatus('saved');
      setTimeout(() => setSavedStatus('idle'), 2000);
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Your Journal</h2>
          <p className="text-xs text-neutral-500 font-medium mt-1">Private space for your thoughts</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
          <ChevronDown size={20} />
        </Button>
      </div>
      
      <div className="flex-1 p-6 pt-2 flex flex-col relative">
        <Textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind? Capture your insights here..."
          className="flex-1 resize-none bg-neutral-50 border-none rounded-3xl p-6 text-base leading-relaxed text-neutral-700 focus-visible:ring-1 focus-visible:ring-neutral-200 focus-visible:bg-white transition-colors"
        />
        
        <div className="absolute bottom-10 right-10">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={cn(
              "rounded-full px-6 py-6 shadow-xl font-bold transition-all",
              savedStatus === 'saved' ? "bg-green-500 hover:bg-green-600" : "bg-neutral-900 hover:bg-neutral-800"
            )}
          >
            {isSaving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : null}
            {savedStatus === 'saved' ? 'Saved!' : 'Save Entry'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const MoreView = ({ 
  onBack, 
  slide,
  isLandscape,
  onToggleLandscape,
  globalVoiceId,
  currentSlideIndex,
  totalSlides
}: { 
  onBack: () => void, 
  slide: SlideData,
  isLandscape: boolean,
  onToggleLandscape: () => void,
  globalVoiceId: string,
  currentSlideIndex: number,
  totalSlides: number
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'chat'>('content');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isVideo = slide.deeperDiveMediaType === 'video';
  const isYoutube = slide.deeperDiveMediaType === 'youtube';

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !geminiConfig.apiKey) return;

    const newUserMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: newUserMsg }]);
    setIsChatLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are a helpful, encouraging assistant for an interactive learning app called SOL DRiVE. 
      The user is currently viewing a section titled "${slide.deeperDiveTitle || 'Deeper Dive'}".
      Context from this section: "${slide.deeperDiveContent || 'No context provided.'}"
      
      User's question: "${newUserMsg}"
      
      Please provide a concise, helpful answer based on the context provided. If the answer isn't in the context, give a general helpful response related to the topic. Keep the tone friendly and supportive.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble thinking right now. Please try again later!" 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Clean up audio on unmount or slide change
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [slide.id, audioUrl]);

  const generateAudio = async () => {
    if (!slide.deeperDiveContent) return;
    setIsGeneratingAudio(true);
    
    try {
      const voiceId = slide.voiceId || globalVoiceId;
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: slide.deeperDiveContent,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: slide.stability || 0.5,
            similarity_boost: slide.similarityBoost || 0.75,
            style: slide.style || 0.0,
            use_speaker_boost: slide.useSpeakerBoost !== false
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate audio');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsPlaying(true);
      if (videoRef.current) videoRef.current.play();
    } catch (error) {
      console.error("Error generating audio:", error);
      setIsPlaying(true); // Fallback to just playing video if audio fails
      if (videoRef.current) videoRef.current.play();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
      videoRef.current?.pause();
    } else {
      // If a custom MP3 URL is provided in Admin, use it (no highlighting for external MP3s yet)
      if (!audioUrl && slide.deeperDiveContent) {
        generateAudio();
      } else {
        setIsPlaying(true);
        audioRef.current?.play();
        videoRef.current?.play();
      }
    }
  };

  if (isLandscape && slide.deeperDiveImageUrl) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center z-[100]">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-6 left-6 z-50 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full"
          onClick={onToggleLandscape}
        >
          <X size={24} />
        </Button>
        {isYoutube ? (
          <iframe 
            src={`https://www.youtube.com/embed/${getYoutubeVideoId(slide.deeperDiveImageUrl)}?autoplay=1&rel=0`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isVideo ? (
          <video 
            ref={videoRef}
            src={slide.deeperDiveImageUrl} 
            className="w-full h-full object-cover"
            playsInline
            loop
          />
        ) : (
          <img 
            src={slide.deeperDiveImageUrl} 
            alt="Deeper Dive Media" 
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bg-neutral-50 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-neutral-100 shrink-0 shadow-sm relative z-20">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
          <ChevronRight className="rotate-180" size={24} />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-neutral-900 truncate">
            {slide.deeperDiveTitle || 'Deeper Dive'}
          </h2>
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
            Slide {currentSlideIndex + 1} of {totalSlides}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 bg-white shrink-0">
        <button 
          onClick={() => setActiveTab('content')}
          className={cn(
            "flex-1 py-3 text-[11px] font-bold tracking-wider uppercase transition-colors relative",
            activeTab === 'content' ? "text-orange-500" : "text-neutral-400 hover:text-neutral-600"
          )}
        >
          Learn More
          {activeTab === 'content' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-4 h-0.5 bg-orange-500 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-3 text-[11px] font-bold tracking-wider uppercase transition-colors relative",
            activeTab === 'chat' ? "text-orange-500" : "text-neutral-400 hover:text-neutral-600"
          )}
        >
          Ask Coach
          {activeTab === 'chat' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-4 h-0.5 bg-orange-500 rounded-t-full" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'content' ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col overflow-y-auto"
            >
              {slide.deeperDiveImageUrl && (
                <div className="w-full aspect-video bg-neutral-900 relative shrink-0">
                  {isYoutube ? (
                    <iframe 
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(slide.deeperDiveImageUrl)}?rel=0`}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isVideo ? (
                    <video 
                      ref={videoRef}
                      src={slide.deeperDiveImageUrl} 
                      className="w-full h-full object-cover"
                      playsInline
                      loop
                    />
                  ) : (
                    <img 
                      src={slide.deeperDiveImageUrl} 
                      alt="Deeper Dive" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {!isYoutube && (
                    <>
                      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <AnimatePresence>
                          {!isPlaying && !isGeneratingAudio && slide.deeperDiveContent && (
                            <motion.button 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              onClick={handlePlayPause}
                              className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all pointer-events-auto shadow-xl"
                            >
                              <Play size={24} className="ml-1 fill-current" />
                            </motion.button>
                          )}
                          {isGeneratingAudio && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl"
                            >
                              <RefreshCw className="animate-spin" size={24} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="p-6 pb-20">
                {slide.deeperDiveContent ? (
                  <div className="prose prose-sm prose-neutral max-w-none">
                    {slide.deeperDiveContent.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="text-neutral-700 leading-relaxed text-[15px] mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                    <Sparkles size={32} className="mb-4 opacity-50" />
                    <p>No additional content provided for this section.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col bg-white"
            >
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-2">Ask the AI Coach</h3>
                    <p className="text-sm text-neutral-500 max-w-[250px]">
                      Have questions about this specific slide or topic? Ask here for personalized insights.
                    </p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-orange-500 text-white rounded-tr-sm" 
                        : "bg-neutral-100 text-neutral-800 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-neutral-100 text-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="animate-spin w-4 h-4 text-neutral-500" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-neutral-100 bg-white">
                <div className="flex gap-2">
                  <Input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder="Ask a question..."
                    className="bg-neutral-50 border-none rounded-xl"
                  />
                  <Button 
                    onClick={handleChatSubmit}
                    disabled={isChatLoading || !chatInput.trim() || !geminiConfig.apiKey}
                    className="bg-orange-500 hover:bg-orange-600 rounded-xl px-4 shrink-0"
                  >
                    Send
                  </Button>
                </div>
                {!geminiConfig.apiKey && (
                  <p className="text-[10px] text-red-500 mt-2 text-center">Gemini API Key missing in environment.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {audioUrl && activeTab === 'content' && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden" 
        />
      )}
    </motion.div>
  );
};

const ConnectView = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-neutral-900 text-white z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h2 className="text-xl font-bold">Community</h2>
          <p className="text-xs text-neutral-400 font-medium mt-1">Connect with others</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronDown size={20} />
        </Button>
      </div>
      
      <div className="flex-1 p-6 pt-12 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
          <MessageSquare size={40} className="text-orange-400" />
        </div>
        <h3 className="text-2xl font-bold mb-4 tracking-tight">Join the Discussion</h3>
        <p className="text-neutral-400 mb-12 max-w-[280px] leading-relaxed">
          Connect with peers, share your journey, and learn from others in our exclusive community space.
        </p>
        
        <div className="w-full space-y-4">
          <Button className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold text-base shadow-lg shadow-orange-500/20 transition-transform active:scale-95">
            Open Community Portal
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-2xl border-white/20 hover:bg-white/10 font-bold text-base transition-transform active:scale-95">
            Share Your Journey
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Admin Components ---

const MediaDropzone = ({ url, type, onUpdate }: { url: string, type: string, onUpdate: (url: string, type: 'image'|'video'|'gif'|'youtube') => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // In a real app, upload to Firebase Storage here and get URL
    // For now, we simulate an upload and use an object URL locally (ephemeral)
    setTimeout(() => {
      const objUrl = URL.createObjectURL(file);
      let mediaType: 'image' | 'video' | 'gif' = 'image';
      if (file.type.startsWith('video/')) mediaType = 'video';
      if (file.type === 'image/gif') mediaType = 'gif';
      onUpdate(objUrl, mediaType);
      setIsUploading(false);
    }, 1000);
  };

  return (
    <div 
      className="relative w-full aspect-video bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 overflow-hidden group cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors flex items-center justify-center"
      onClick={handleUploadClick}
    >
      {url ? (
        <>
          {type === 'video' ? (
            <video src={url} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
          ) : type === 'youtube' ? (
             <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-500">
               <Play size={32} />
               <span className="ml-2 font-bold text-sm uppercase tracking-wider">YouTube Video</span>
             </div>
          ) : (
            <img src={url} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 p-3 rounded-full shadow-sm mb-2">
              <RefreshCw size={20} className="text-orange-500" />
            </div>
            <span className="text-xs font-bold text-neutral-900">Replace Media</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-neutral-400">
          <Plus size={32} className="mb-2 group-hover:text-orange-500 transition-colors" />
          <span className="text-xs font-medium">Click to upload media</span>
        </div>
      )}
      
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*" 
      />
    </div>
  );
};

const SortableSlide = ({ 
  slide, 
  index, 
  onUpdate, 
  onRemove, 
  isOnlySlide 
}: { 
  slide: SlideData, 
  index: number, 
  onUpdate: (data: Partial<SlideData>) => void, 
  onRemove: () => void,
  isOnlySlide: boolean
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <Card className={cn(
        "border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full bg-white relative overflow-hidden",
        isDragging && "shadow-2xl ring-2 ring-orange-500 border-transparent"
      )}>
        {/* Delete Confirmation Overlay */}
        <AnimatePresence>
          {showConfirmDelete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-2">Delete this slide?</h3>
              <p className="text-xs text-neutral-500 mb-6">Are you sure you wanna delete this slide? It can't be undone.</p>
              <div className="flex flex-col w-full gap-2">
                <Button 
                  variant="destructive" 
                  className="w-full rounded-xl font-bold"
                  onClick={onRemove}
                >
                  Yes, Delete Slide
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full rounded-xl font-bold text-neutral-500"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-neutral-50">
          <div className="flex items-center gap-2">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              <GripVertical size={16} className="text-neutral-400" />
            </div>
            <div className="w-6 h-6 bg-neutral-100 rounded flex items-center justify-center text-[10px] font-bold text-neutral-500">
              {index + 1}
            </div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400">Slide Content</CardTitle>
          </div>
          {!isOnlySlide && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowConfirmDelete(true)}
              className="h-8 w-8 text-neutral-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-4 flex-1">
          {/* Media Preview / Dropzone */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase text-neutral-400">Media ({slide.slideType || 'generic'})</Label>
              {slide.slideType === 'photo' && (
                <div className="flex bg-neutral-100 p-1 rounded-lg gap-1 border border-neutral-200 shadow-inner">
                  {['1:1', '4:3', '3:4'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => onUpdate({ aspectRatio: ratio as any })}
                      className={cn(
                        "text-[9px] font-bold px-2 py-1 rounded-md transition-all active:scale-95",
                        slide.aspectRatio === ratio 
                          ? "bg-white text-orange-600 shadow-sm" 
                          : "text-neutral-400 hover:text-neutral-600"
                      )}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              )}
              {slide.slideType === 'video' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                  <Monitor size={10} className="text-blue-500" />
                  <span className="text-[9px] font-bold text-blue-600 uppercase">Fixed 9:16 / 16:9</span>
                </div>
              )}
            </div>
            
            <MediaDropzone 
              url={slide.mediaUrl} 
              type={slide.mediaType} 
              onUpdate={(url, type) => onUpdate({ mediaUrl: url, mediaType: type })} 
            />
            <Input 
              value={slide.mediaUrl} 
              onChange={(e) => {
                const url = e.target.value;
                const ext = url.split('.').pop()?.split('?')[0].toLowerCase();
                let type: 'image' | 'video' | 'gif' = 'image';
                if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) type = 'video';
                else if (ext === 'gif') type = 'gif';
                onUpdate({ mediaUrl: url, mediaType: type });
              }}
              placeholder="Or paste URL here..."
              className="text-[10px] h-8 bg-neutral-50"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-neutral-400">Story Text</Label>
            <Textarea 
              value={slide.textContent}
              onChange={(e) => onUpdate({ textContent: e.target.value })}
              className="min-h-[120px] text-sm resize-none bg-neutral-50 border-neutral-100 focus:bg-white transition-colors"
              placeholder="What happens in this part of the story?"
            />
          </div>

          {/* Voice Settings */}
          <div className="pt-4 border-t border-neutral-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Voice Tuning</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-orange-500">{Math.round((slide.stability || 0.5) * 100)}%</span>
                <Sliders size={10} className="text-neutral-300" />
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={slide.stability || 0.5}
              onChange={(e) => onUpdate({ stability: parseFloat(e.target.value) })}
              className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Deeper Dive Section */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Deeper Dive (More Section)</span>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-neutral-400">Section Title</Label>
              <Input 
                value={slide.deeperDiveTitle || ''} 
                onChange={(e) => onUpdate({ deeperDiveTitle: e.target.value })}
                placeholder="e.g., Technical Specifications"
                className="text-xs bg-neutral-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-neutral-400">Section Media (Drag & Drop or URL)</Label>
              <MediaDropzone 
                url={slide.deeperDiveImageUrl || ''} 
                type={slide.deeperDiveMediaType === 'youtube' ? 'image' : (slide.deeperDiveMediaType || 'image')} 
                onUpdate={(url, type) => onUpdate({ deeperDiveImageUrl: url, deeperDiveMediaType: type })} 
              />
              <Input 
                value={slide.deeperDiveImageUrl || ''} 
                onChange={(e) => {
                  const url = e.target.value;
                  let type: 'image' | 'video' | 'gif' | 'youtube' = 'image';
                  
                  if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    type = 'youtube';
                  } else {
                    const ext = url.split('.').pop()?.split('?')[0].toLowerCase();
                    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) type = 'video';
                    else if (ext === 'gif') type = 'gif';
                  }
                  
                  onUpdate({ deeperDiveImageUrl: url, deeperDiveMediaType: type });
                }}
                placeholder="Paste image, video, or YouTube URL..."
                className="text-[10px] bg-neutral-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-neutral-400">Section Content</Label>
              <Textarea 
                value={slide.deeperDiveContent || ''}
                onChange={(e) => onUpdate({ deeperDiveContent: e.target.value })}
                className="min-h-[100px] text-xs resize-none bg-neutral-50 border-neutral-100 focus:bg-white transition-colors"
                placeholder="Provide more in-depth details here..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = ({ 
  content, 
  onSave, 
  onExit 
}: { 
  content: ContentData, 
  onSave: (newContent: ContentData) => void,
  onExit: () => void
}) => {
  const [form, setForm] = useState<ContentData>(content);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddPlaceholderMenu, setShowAddPlaceholderMenu] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleMainScroll = () => {
    if (mainScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mainScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      setScrollProgress(progress);
    }
  };

  const scrollToPercent = (percent: number, smooth = true) => {
    if (mainScrollRef.current) {
      const { scrollWidth, clientWidth } = mainScrollRef.current;
      const targetScroll = percent * (scrollWidth - clientWidth);
      
      if (smooth) {
        mainScrollRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      } else {
        mainScrollRef.current.scrollLeft = targetScroll;
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateSlide = (index: number, data: Partial<SlideData>) => {
    const newSlides = [...form.slides];
    newSlides[index] = { ...newSlides[index], ...data };
    setForm({ ...form, slides: newSlides });
  };

  const addSlide = (type: 'photo' | 'video') => {
    setForm({
      ...form,
      slides: [...form.slides, { 
        id: `slide-${Date.now()}`,
        mediaType: type === 'video' ? 'video' : 'image',
        mediaUrl: type === 'video' 
          ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          : 'https://picsum.photos/seed/new/800/800',
        textContent: 'New Slide Content',
        slideType: type,
        aspectRatio: type === 'video' ? '9:16' : '1:1',
        voiceId: form.globalVoiceId,
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true
      }]
    });
  };

  const removeSlide = (index: number) => {
    if (form.slides.length <= 1) return;
    const newSlides = form.slides.filter((_, i) => i !== index);
    setForm({ ...form, slides: newSlides });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setForm((prev) => {
        const oldIndex = prev.slides.findIndex((s) => s.id === active.id);
        const newIndex = prev.slides.findIndex((s) => s.id === over.id);
        return {
          ...prev,
          slides: arrayMove(prev.slides, oldIndex, newIndex),
        };
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    onSave(form);
    setTimeout(() => setIsSaving(false), 500);
  };

  const applyVoiceToAll = () => {
    const newSlides = form.slides.map(slide => ({
      ...slide,
      voiceId: form.globalVoiceId,
    }));
    setForm({ ...form, slides: newSlides });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Dashboard Header */}
      <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900">Content Storyboard</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onExit} className="rounded-full px-6">
            <Smartphone className="mr-2 h-4 w-4" />
            Preview App
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 font-bold shadow-lg shadow-orange-200"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full space-y-8">
        {/* Global Settings Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[300px] space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Global Voice ID</Label>
            <div className="flex gap-2">
              <Input 
                value={form.globalVoiceId} 
                onChange={(e) => setForm({ ...form, globalVoiceId: e.target.value })}
                placeholder="ElevenLabs Voice ID"
                className="bg-neutral-50 border-neutral-200 focus:ring-orange-500"
              />
              <Button variant="outline" onClick={applyVoiceToAll} className="shrink-0">Apply to All</Button>
            </div>
          </div>
          <div className="flex gap-4 relative">
            <div className="text-center px-4 border-r border-neutral-100 min-w-[100px]">
              <p className="text-2xl font-bold text-neutral-900">
                {Math.min(Math.round(scrollProgress * (form.slides.length > 1 ? form.slides.length - 1 : 1)) + 1, form.slides.length)}
                <span className="text-neutral-300 font-light mx-1">/</span>
                <span className="text-neutral-400">{form.slides.length}</span>
              </p>
              <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Slide Position</p>
            </div>
            
            <div className="relative">
              <Button 
                onClick={() => setShowAddMenu(!showAddMenu)} 
                className="bg-neutral-900 text-white rounded-xl h-12 px-6 hover:bg-neutral-800 transition-colors shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Slide
              </Button>

              <AnimatePresence>
                {showAddMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-14 w-56 bg-white rounded-2xl p-2 shadow-2xl border border-neutral-100 z-50 overflow-hidden"
                    >
                      <div className="text-[10px] font-bold uppercase text-neutral-400 px-3 py-2">Select Type</div>
                      <div className="h-[1px] bg-neutral-50 mb-1" />
                      <button 
                        onClick={() => { addSlide('photo'); setShowAddMenu(false); }}
                        className="w-full rounded-xl flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          <ImageIcon size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-900">Photograph Slide</span>
                          <span className="text-[9px] text-neutral-500">Fixed ratios (1:1, 4:3, 3:4)</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => { addSlide('video'); setShowAddMenu(false); }}
                        className="w-full rounded-xl flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <Video size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-900">Video Slide</span>
                          <span className="text-[9px] text-neutral-500">Responsive (9:16 / 16:9)</span>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Storyboard Grid */}
        <div className="space-y-6">
          {/* Visual Navigator (Track and Circle) */}
          <div className="px-1 py-6">
            <div 
              ref={trackRef}
              className="h-2 w-full bg-neutral-100 rounded-full relative cursor-pointer group shadow-inner"
              onClick={(e) => {
                if (trackRef.current) {
                  const rect = trackRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  scrollToPercent(x / rect.width);
                }
              }}
            >
              {/* Slide Marker Tracks */}
              <div className="absolute inset-0 flex justify-between px-1 z-10">
                {form.slides.map((_, i) => (
                  <button 
                    key={i} 
                    className="flex flex-col items-center h-full group/marker relative pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToPercent(i / (form.slides.length > 1 ? form.slides.length - 1 : 1));
                    }}
                  >
                    <div className="h-full w-px bg-neutral-300 group-hover/marker:bg-orange-500 transition-colors" />
                    <span className="absolute -bottom-6 text-[10px] font-bold text-neutral-300 group-hover/marker:text-orange-500 transition-colors">
                      {i + 1}
                    </span>
                  </button>
                ))}
                <div className="h-full w-px bg-neutral-300" />
              </div>

              {/* Active Indicator (The Circle) */}
              <motion.div 
                drag="x"
                dragConstraints={trackRef}
                dragElastic={0}
                dragMomentum={false}
                onDrag={(event, info) => {
                  if (trackRef.current) {
                    const rect = trackRef.current.getBoundingClientRect();
                    // info.point.x is global, convert to local track relative
                    const x = info.point.x - rect.left;
                    const percent = Math.max(0, Math.min(1, x / rect.width));
                    scrollToPercent(percent, false);
                  }
                }}
                className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-neutral-900 rounded-full border-4 border-white shadow-2xl cursor-grab active:cursor-grabbing z-20 flex items-center justify-center transition-shadow hover:shadow-orange-200/50"
                style={{ 
                  left: `calc(${scrollProgress * 100}% - 16px)`,
                  x: 0 // Reset x transform so it doesn't fight with our calculated left
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              >
                <div className="text-[10px] font-black text-white pointer-events-none">
                  {Math.min(Math.round(scrollProgress * (form.slides.length > 1 ? form.slides.length - 1 : 1)) + 1, form.slides.length)}
                </div>
                
                {/* Visual Glow */}
                <div className="absolute inset-0 rounded-full bg-neutral-900 animate-ping opacity-10 pointer-events-none" />

                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 whitespace-nowrap">
                  Current: Slide {Math.min(Math.round(scrollProgress * (form.slides.length > 1 ? form.slides.length - 1 : 1)) + 1, form.slides.length)}
                </div>
              </motion.div>

              {/* Progress Line */}
              <motion.div 
                className="absolute inset-y-0 left-0 bg-orange-100 rounded-full pointer-events-none z-10"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={form.slides.map(s => s.id)}
              strategy={rectSortingStrategy}
            >
              <div 
                ref={mainScrollRef}
                onScroll={handleMainScroll}
                className="flex gap-6 overflow-x-auto pb-12 custom-scrollbar snap-x"
              >
              {form.slides.map((slide: SlideData, index: number) => (
                <div key={slide.id} className="min-w-[350px] snap-start">
                  <SortableSlide 
                    slide={slide}
                    index={index}
                    onUpdate={(data: Partial<SlideData>) => updateSlide(index, data)}
                    onRemove={() => removeSlide(index)}
                    isOnlySlide={form.slides.length <= 1}
                  />
                </div>
              ))}
              
              {/* Add Slide Placeholder */}
              <div className="relative">
                <button 
                  onClick={() => setShowAddPlaceholderMenu(!showAddPlaceholderMenu)}
                  className="min-w-[350px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all min-h-[600px] snap-start"
                >
                  <div className="p-4 bg-white rounded-full shadow-sm border border-neutral-100">
                    <Plus size={32} />
                  </div>
                  <span className="font-bold text-sm">Add Next Slide</span>
                </button>

                <AnimatePresence>
                  {showAddPlaceholderMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAddPlaceholderMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-56 bg-white rounded-2xl p-2 shadow-2xl border border-neutral-100 z-50 overflow-hidden"
                      >
                        <button 
                          onClick={() => { addSlide('photo'); setShowAddPlaceholderMenu(false); }}
                          className="w-full rounded-xl flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors text-left"
                        >
                          <ImageIcon size={18} className="text-orange-500" />
                          <span className="text-xs font-bold text-neutral-900">Photograph Slide</span>
                        </button>
                        <button 
                          onClick={() => { addSlide('video'); setShowAddPlaceholderMenu(false); }}
                          className="w-full rounded-xl flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <Video size={18} className="text-blue-500" />
                          <span className="text-xs font-bold text-neutral-900">Video Slide</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </main>
    </div>
  );
};

// --- Main App ---

const LoginView = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-neutral-100 text-center">
        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-100">
          <Play className="text-white fill-current" size={40} />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">ContentFlow</h1>
        <p className="text-neutral-500 mb-10 font-medium">Your interactive storyboard experience.</p>
        
        <Button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-8 rounded-2xl font-bold text-lg shadow-xl shadow-neutral-200 transition-all active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <LogIn className="mr-2" />
          )}
          Sign in with Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-400 font-bold tracking-widest">Or</span>
          </div>
        </div>

        <Button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-8 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 transition-all active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <UserPlus className="mr-2" />
          )}
          Sign up with Google
        </Button>
        
        <p className="mt-8 text-xs text-neutral-400 font-medium">
          By signing in, you agree to our terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeView, setActiveView] = useState('lesson');
  const [isLandscape, setIsLandscape] = useState(false);
  const [content, setContent] = useState<ContentData>(DEFAULT_CONTENT);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      try {
        if (user) {
          // Fetch user role
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            // Force existing users to be admin as well
            setUserRole('admin');
            setIsAdminMode(true);
          } else {
            // Make all new users admin to access the dashboard
            const role = 'admin';
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: role,
              displayName: user.displayName,
              photoURL: user.photoURL
            });
            setUserRole(role);
            setIsAdminMode(true);
          }
        } else {
          setUserRole(null);
          setIsAdminMode(false);
        }
      } catch (error) {
        console.error("Error setting up user profile or role:", error);
      } finally {
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = 'app_content/main';
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data() as ContentData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveContent = async (newContent: ContentData) => {
    const path = 'app_content/main';
    try {
      await setDoc(doc(db, path), {
        ...newContent,
        updatedAt: new Date().toISOString()
      });
      setContent(newContent);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsLandscape(false);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (isAdminMode && userRole === 'admin') {
    return (
      <AdminDashboard 
        content={content} 
        onSave={handleSaveContent}
        onExit={() => setIsAdminMode(false)}
      />
    );
  }

  return (
    <MobileFrame 
      onToggleAdmin={() => userRole === 'admin' && setIsAdminMode(true)}
      isLandscape={isLandscape}
    >
      <div className="flex-1 relative overflow-hidden">
        <LessonView 
          content={content} 
          onNavigate={handleNavigate} 
          user={user}
          isLandscape={isLandscape}
          onToggleLandscape={() => setIsLandscape(!isLandscape)}
          currentSlideIndex={currentSlideIndex}
          setCurrentSlideIndex={setCurrentSlideIndex}
        />
        
        <AnimatePresence>
          {activeView === 'notes' && (
            <NotesView onBack={() => handleNavigate('lesson')} user={user} />
          )}
          {activeView === 'more' && (
            <MoreView 
              onBack={() => handleNavigate('lesson')} 
              slide={content.slides[currentSlideIndex]}
              isLandscape={isLandscape}
              onToggleLandscape={() => setIsLandscape(!isLandscape)}
              globalVoiceId={content.globalVoiceId}
              currentSlideIndex={currentSlideIndex}
              totalSlides={content.slides.length}
            />
          )}
          {activeView === 'connect' && (
            <ConnectView onBack={() => handleNavigate('lesson')} />
          )}
        </AnimatePresence>
      </div>
    </MobileFrame>
  );
}