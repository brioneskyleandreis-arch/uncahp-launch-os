import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Play, Loader2 } from 'lucide-react';
import { fetchVideoSource } from '../lib/metaApi';

const AdCreativeModal = ({ isOpen, onClose, creative, campaignName }) => {
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);

    const videoId = creative?.object_story_spec?.video_data?.video_id || creative?.video_id;
    const isVideo = !!videoId;

    useEffect(() => {
        if (isOpen && isVideo && videoId) {
            let isMounted = true;
            setIsLoadingVideo(true);
            setVideoUrl(null);

            fetchVideoSource(videoId).then(url => {
                if (isMounted) {
                    setVideoUrl(url);
                    setIsLoadingVideo(false);
                }
            });

            return () => {
                isMounted = false;
            };
        }
    }, [isOpen, isVideo, videoId]);

    if (!isOpen || !creative) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-[--bg-card] border border-[--border] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[--border] bg-[--bg-surface]">
                    <div>
                        <h3 className="text-lg font-bold text-[--text-main]">Ad Creative Preview</h3>
                        <p className="text-sm text-[--text-muted] truncate max-w-md">{campaignName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[--bg-card] rounded-lg text-[--text-muted] hover:text-[--text-main] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col md:flex-row gap-6">
                    {/* Image Area */}
                    <div className="flex-1 flex justify-center items-start">
                        <div className={`bg-[--bg-app] w-full rounded-xl border border-[--border] overflow-hidden flex items-center justify-center relative ${isVideo ? 'aspect-[9/16] max-w-[320px]' : 'aspect-square max-w-[400px]'}`}>
                            {isVideo && !videoUrl && (
                                <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-white/90 text-[10px] font-bold border border-white/10 uppercase tracking-widest shadow-xl">
                                    {isLoadingVideo ? <Loader2 size={10} className="animate-spin text-white" /> : <Play size={10} className="fill-white" />}
                                    Video
                                </div>
                            )}

                            {isVideo && videoUrl ? (
                                <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    muted
                                    className="w-full h-full object-contain bg-black"
                                />
                            ) : creative.image_url ? (
                                <img
                                    src={creative.image_url}
                                    alt="Ad Creative"
                                    className="w-full h-full object-contain"
                                />
                            ) : creative.thumbnail_url ? (
                                <img
                                    src={creative.thumbnail_url}
                                    alt="Ad Thumbnail"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-[--text-muted]">
                                    <ImageIcon size={48} className="mb-2 opacity-50" />
                                    <span>No Image Available</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Copy Area */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div>
                            <h4 className="text-xs font-bold text-[--text-muted] uppercase tracking-wider mb-2">Headline</h4>
                            <p className="text-[--text-main] font-semibold">
                                {creative.title || 'No Headline Provided'}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[--text-muted] uppercase tracking-wider mb-2">Primary Text</h4>
                            <div className="bg-[--bg-surface] p-4 rounded-xl border border-[--border] text-sm text-[--text-main] whitespace-pre-wrap">
                                {creative.body || 'No Primary Text Provided'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[--border] bg-[--bg-surface] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[--bg-card] hover:bg-[--bg-surface-hover] text-[--text-main] rounded-lg border border-[--border] transition-colors font-medium"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdCreativeModal;
