import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLaunch } from '../context/LaunchContext';
import { useAuth } from '../context/AuthContext';
import { stages } from '../data/mockData';
import { ArrowLeft, Calendar, Flag, Hash, FileText, Image, PenTool, Send, Check, Rocket, MoreHorizontal, Save, X, RotateCcw, Paperclip, Download, ExternalLink, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';


const LaunchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { launches, profiles, updateLaunchStage, undoLaunchStage, updateLaunchResources, updateLaunchNotes, addMessage, uploadFile } = useLaunch();
    const { user } = useAuth();
    const { addToast } = useToast();
    const messagesEndRef = useRef(null);

    // Use loose equality or string conversion to handle number/string ID mismatch
    const launch = launches.find(l => String(l.id) === String(id));

    const [composedMessage, setComposedMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState('');
    const fileInputRef = useRef(null);

    // Resource Edit State
    const [isEditingResources, setIsEditingResources] = useState(false);
    const [resourceLinks, setResourceLinks] = useState({
        slack: '',
        notion: '',
        drive: '',
        copy: '',
        landing: '',
        reframe: ''
    });

    // Notes Edit State
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesContent, setNotesContent] = useState('');

    // Mention State
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);



    // Auto-scroll to bottom of chat
    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [launch?.messages]);

    useEffect(() => {
        if (launch) {
            if (launch.resources) {
                setResourceLinks({
                    slack: launch.resources.slack || '[Add Link Here]',
                    notion: launch.resources.notion || '[Add Link Here]',
                    drive: launch.resources.drive || '[Add Link Here]',
                    copy: launch.resources.copy || '[Add Link Here]',
                    landing: launch.resources.landing || '[Add Link Here]',
                    reframe: launch.resources.reframe || '[Add Link Here]'
                });
            }
            setNotesContent(launch.notes || '');
        }
    }, [launch]);

    const handleSaveNotes = async () => {
        try {
            await updateLaunchNotes(id, notesContent);
            setIsEditingNotes(false);
            addToast("Notes updated successfully!", "success");
        } catch (error) {
            console.error("Save notes error:", error);
            addToast(`Failed to update notes: ${error.message}`, "error");
        }
    };

    if (!launch) {
        return (
            <div className="flex items-center justify-center h-full text-[--text-muted]">
                <div className="text-center">
                    <p className="text-xl font-bold mb-2">Launch Not Found</p>
                    <p className="text-sm">The launch with ID {id} could not be located.</p>
                    <button onClick={() => navigate('/')} className="mt-4 btn btn-primary">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const handleStageUndo = async (stageId) => {
        if (window.confirm("Undo this stage completion?")) {
            try {
                await undoLaunchStage(id, stageId, user);
                addToast("Stage marked as incomplete.", "success");
            } catch (error) {
                addToast("Failed to undo stage.", "error");
            }
        }
    };

    const handleStageComplete = async (stageId) => {
        try {
            await updateLaunchStage(id, stageId, user);
            addToast("Stage marked as complete!", "success");
        } catch (error) {
            addToast("Failed to update stage.", "error");
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            addToast('File size must be less than 10MB', 'error');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!composedMessage.trim() && !selectedFile) return;

        try {
            setIsUploading(true);
            let attachment = null;

            // Upload file if selected
            if (selectedFile) {
                try {
                    attachment = await uploadFile(id, selectedFile);
                } catch (uploadError) {
                    console.error('File upload error:', uploadError);
                    addToast(`File upload failed: ${uploadError.message || 'Unknown error'}`, "error");
                    setIsUploading(false);
                    return;
                }
            }

            await addMessage(id, {
                id: Date.now(),
                user: user?.user_metadata?.full_name || user?.email || 'Anonymous',
                userId: user?.id,
                text: composedMessage,
                time: format(new Date(), 'h:mm a'),
                ...(attachment && { attachment })
            });
            setComposedMessage('');
            handleClearFile();
        } catch (error) {
            console.error('Send message error:', error);
            addToast(`Failed to send message: ${error.message || 'Unknown error'}`, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveResources = async () => {
        try {
            await updateLaunchResources(id, resourceLinks, user);
            setIsEditingResources(false);
            addToast("Resources updated successfully!", "success");
        } catch (error) {
            console.error("Save resources error:", error);
            addToast(`Failed to update resources: ${error.message}`, "error");
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        const selectionStart = e.target.selectionStart;
        setComposedMessage(value);
        setCursorPosition(selectionStart);

        // Check for trigger '@'
        const lastAtPos = value.lastIndexOf('@', selectionStart);
        if (lastAtPos !== -1) {
            // Check if there's a space before the @ (or it's the start)
            const isStart = lastAtPos === 0;
            const hasSpaceBefore = value[lastAtPos - 1] === ' ';

            if (isStart || hasSpaceBefore) {
                const query = value.substring(lastAtPos + 1, selectionStart);
                // Only show if query doesn't contain spaces (simple implementation)
                if (!query.includes(' ')) {
                    setMentionQuery(query);
                    setShowMentions(true);
                    return;
                }
            }
        }
        setShowMentions(false);
    };

    const handleMentionSelect = (profile) => {
        const lastAtPos = composedMessage.lastIndexOf('@', cursorPosition);
        if (lastAtPos !== -1) {
            const before = composedMessage.substring(0, lastAtPos);
            const after = composedMessage.substring(cursorPosition);
            const name = profile.full_name || profile.username || 'User';
            const newValue = `${before}@${name} ${after}`;
            setComposedMessage(newValue);
            setShowMentions(false);

            // Set cursor after the inserted name
            // We need to defer this to next tick or use a ref
            // simple for now
        }
    };

    // Filter profiles for mentions
    // Fallback Mock Users if no profiles from DB yet
    const mockProfiles = [
        { id: 'mock1', full_name: 'James', avatar_url: null },
        { id: 'mock2', full_name: 'Cathy', avatar_url: null },
        { id: 'mock3', full_name: 'Franz', avatar_url: null }
    ];

    // Combine real profiles and mock profiles (deduplicated by name if possible, or just prioritize real)
    // Actually, let's just use real profiles if available, plus current user to test
    const availableProfiles = profiles.length > 0 ? profiles : mockProfiles;

    const filteredProfiles = availableProfiles.filter(p => {
        const name = p.full_name || p.username || '';
        return name.toLowerCase().includes(mentionQuery.toLowerCase());
    });

    const currentStageIndex = stages.findIndex(s => !launch.completedStages.includes(s.id));
    // If all completed, index is -1
    const activeStageId = currentStageIndex === -1 ? 'complete' : stages[currentStageIndex]?.id;

    const getProgress = () => {
        return Math.round((launch.completedStages.length / stages.length) * 100);
    }

    return (
        <div className="flex flex-col h-full bg-[--bg-app]">
            {/* Top Bar */}
            <div className="h-16 border-b border-[--border] flex items-center justify-between px-6 bg-[--bg-app]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-[--text-muted] hover:text-[--text-main] transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <div className="text-xs text-[--text-muted] breadcrumbs">Mission Control &gt; {launch.client}</div>
                        <h1 className="text-lg font-bold flex items-center gap-4">
                            {launch.offer}
                            <div className="flex items-center gap-2 text-sm font-normal text-[--text-muted]">
                                <Rocket size={14} /> Treatment: <span className="text-[--text-main] font-medium">{launch.treatment}</span>
                            </div>
                            {launch.referenceNumber && (
                                <span className="text-xs font-bold text-[--text-main] bg-[--bg-surface] border border-[--border] px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                    Ref: <span className="text-[--primary]">#{launch.referenceNumber}</span>
                                </span>
                            )}
                            {launch.launch_type && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[--bg-surface] border border-[--border] text-[--text-muted] tracking-wide">
                                    {launch.launch_type}
                                </span>
                            )}
                            {launch.completedStages.length === stages.length ? (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[--success] text-white">Completed</span>
                            ) : (
                                <span className="bg-blue-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse tracking-wider">In Progress</span>
                            )}
                        </h1>
                    </div>



                </div>

                <div className="flex items-center gap-6 text-sm text-[--text-muted]">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} /> Start: <span className="text-[--text-main] font-medium">{launch.startDate || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Flag size={14} /> Target: <span className="text-[--text-main] font-medium">{launch.targetLaunchDate}</span>
                    </div>

                    {/* Dynamic Team Avatars (Chat Participants) */}
                    <div className="flex -space-x-2">
                        {(() => {
                            // Get unique participants from messages
                            const uniqueParticipantIds = [...new Set(
                                (launch.messages || [])
                                    .filter(m => !m.isSystem && m.userId) // Exclude system and nulls
                                    .map(m => m.userId)
                            )];

                            // Map to profiles to get latest avatar
                            const participants = uniqueParticipantIds.map(uid => {
                                const profile = profiles.find(p => p.id === uid);
                                return {
                                    id: uid,
                                    name: profile?.full_name || profile?.username || 'User',
                                    avatar: profile?.avatar_url
                                };
                            });

                            // If no participants, show current user or empty state
                            if (participants.length === 0) {
                                return (
                                    <div className="w-8 h-8 rounded-full bg-[--bg-surface] border-2 border-[--bg-app] flex items-center justify-center text-xs text-[--text-muted]">
                                        <Hash size={14} />
                                    </div>
                                );
                            }

                            const displayCount = 3;
                            const visibleParticipants = participants.slice(0, displayCount);
                            const remainingCount = participants.length - displayCount;

                            return (
                                <>
                                    {visibleParticipants.map(participant => (
                                        <div
                                            key={participant.id}
                                            className="w-8 h-8 rounded-full border-2 border-[--bg-app] bg-[--bg-surface] flex items-center justify-center text-xs font-bold text-[--text-main] overflow-hidden relative"
                                            title={participant.name}
                                        >
                                            {participant.avatar ? (
                                                <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                                                    {participant.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {remainingCount > 0 && (
                                        <div className="w-8 h-8 rounded-full bg-[--bg-surface] border-2 border-[--bg-app] flex items-center justify-center text-xs font-bold text-[--text-muted]">
                                            +{remainingCount}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-12 grid-rows-1">

                {/* Timeline (Left) */}
                <div className="col-span-4 border-r border-[--border] h-full overflow-y-auto p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg">Launch Timeline</h2>
                        <span className="text-xs text-[--primary] font-bold">{getProgress()}% Complete</span>
                    </div>

                    <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[51px] before:w-0.5 before:bg-[--border]">
                        {stages.map((stage, idx) => {
                            const isCompleted = launch.completedStages.includes(stage.id);
                            const isActive = stage.id === activeStageId;
                            // Unlocked: allow any stage to be clicked

                            return (
                                <div key={stage.id} className="relative pl-16 transition-opacity opacity-100">
                                    {/* Dot/Connector */}
                                    <div className={`absolute left-0 top-1 w-10 h-10 ml-4 rounded-full flex items-center justify-center transition-all z-10
                                    ${isCompleted ? 'bg-[--primary] text-white border-4 border-[--bg-app]' :
                                            isActive ? 'stage-active-glow text-[--primary]' :
                                                'bg-[--bg-surface] text-[--text-muted] border-4 border-[--bg-app]'
                                        }`}>
                                        {isCompleted ? (
                                            <Check size={16} strokeWidth={4} />
                                        ) : isActive ? (
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute w-5 h-5 rounded-full bg-[--primary] opacity-40 animate-ping"></div>
                                                <div className="relative z-10 w-3 h-3 rounded-full bg-[--primary] shadow-[0_0_8px_var(--primary)]"></div>
                                            </div>
                                        ) : (
                                            <div className="w-3 h-3 rounded-full bg-[--text-muted]"></div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 pt-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold ${isActive ? 'text-[--primary]' : ''}`}>{stage.label}</h3>
                                            {isCompleted && (
                                                <button
                                                    onClick={() => handleStageUndo(stage.id)}
                                                    className="p-1 text-[--text-muted] hover:text-[--warning] hover:bg-[--bg-surface] rounded transition-colors"
                                                    title="Undo Completion"
                                                >
                                                    <RotateCcw size={12} />
                                                </button>
                                            )}
                                        </div>
                                        {isCompleted ? (
                                            <div className="text-xs text-[--success]">Completed</div>
                                        ) : isActive ? (
                                            <div className="text-xs text-[--text-muted] font-bold uppercase tracking-wider">In Progress</div>
                                        ) : (
                                            <div className="text-xs text-[--text-muted]">Pending</div>
                                        )}
                                    </div>

                                    {!isCompleted && (
                                        <button
                                            onClick={() => handleStageComplete(stage.id)}
                                            className="mt-3 btn btn-primary w-fit text-sm font-bold uppercase tracking-wide py-2 px-6 shadow-lg shadow-[rgba(244,140,207,0.4)] hover:scale-105 transition-transform"
                                        >
                                            <Check size={16} className="mr-2" /> Mark Complete
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Resources (Middle) */}
                <div className="col-span-4 border-r border-[--border] h-full overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <h2 className="font-bold text-lg">Campaign Resources</h2>
                            <span className="text-xs text-[--text-muted]">Manage your campaign links</span>
                        </div>
                        {isEditingResources ? (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingResources(false)} className="p-2 hover:bg-[--bg-surface] rounded text-[--error]" title="Cancel">
                                    <X size={16} />
                                </button>
                                <button onClick={handleSaveResources} className="p-2 bg-[--primary] text-white rounded hover:opacity-90 shadow-lg shadow-[rgba(244,140,207,0.4)]" title="Save Links">
                                    <Save size={16} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditingResources(true)} className="text-[--text-muted] hover:text-[--text-main] p-2 rounded hover:bg-[--bg-surface] transition-colors" title="Edit Resources">
                                <PenTool size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <ResourceCard
                            icon={<Hash size={24} className="text-purple-400" />}
                            title="Slack Channel"
                            color="bg-purple-400/10"
                            isEditing={isEditingResources}
                            value={resourceLinks.slack}
                            onChange={(val) => setResourceLinks(prev => ({ ...prev, slack: val }))}
                        />
                        <ResourceCard
                            icon={<FileText size={24} className="text-blue-400" />}
                            title="Notion Brief"
                            color="bg-blue-400/10"
                            isEditing={isEditingResources}
                            value={resourceLinks.notion}
                            onChange={(val) => setResourceLinks(prev => ({ ...prev, notion: val }))}
                        />
                        <ResourceCard
                            icon={<Image size={24} className="text-pink-400" />}
                            title="Creative Assets"
                            color="bg-pink-400/10"
                            isEditing={isEditingResources}
                            value={resourceLinks.drive}
                            onChange={(val) => setResourceLinks(prev => ({ ...prev, drive: val }))}
                        />
                        <ResourceCard
                            icon={<PenTool size={24} className="text-emerald-400" />}
                            title="Ad Copy"
                            color="bg-emerald-400/10"
                            isEditing={isEditingResources}
                            value={resourceLinks.copy}
                            onChange={(val) => setResourceLinks(prev => ({ ...prev, copy: val }))}
                        />
                        <ResourceCard
                            icon={<ExternalLink size={24} className="text-orange-400" />}
                            title="Landing Page"
                            color="bg-orange-400/10"
                            isEditing={isEditingResources}
                            value={resourceLinks.landing}
                            onChange={(val) => setResourceLinks(prev => ({ ...prev, landing: val }))}
                        />
                        <ResourceCard
                            icon={<Repeat size={24} className="text-cyan-400" />}
                            title="Reframe"
                            color="bg-cyan-400/10"
                            isEditing={isEditingResources}
                            value={resourceLinks.reframe}
                            onChange={(val) => setResourceLinks(prev => ({ ...prev, reframe: val }))}
                        />
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg">Notes</h2>
                            {isEditingNotes ? (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingNotes(false)} className="p-1 hover:bg-[--bg-surface] rounded text-[--error]" title="Cancel">
                                        <X size={14} />
                                    </button>
                                    <button onClick={handleSaveNotes} className="p-1 bg-[--primary] text-white rounded hover:opacity-90 shadow-lg shadow-[rgba(244,140,207,0.4)]" title="Save Notes">
                                        <Save size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditingNotes(true)} className="text-[--text-muted] hover:text-[--text-main] transition-colors">
                                    <PenTool size={14} />
                                </button>
                            )}
                        </div>
                        {isEditingNotes ? (
                            <div className="card bg-[--bg-surface] p-2">
                                <textarea
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-[--text-muted] leading-relaxed resize-none outline-none min-h-[100px]"
                                    value={notesContent}
                                    onChange={(e) => setNotesContent(e.target.value)}
                                    placeholder="Add campaign notes here..."
                                />
                            </div>
                        ) : (
                            <div className="card bg-[--bg-surface] p-4 text-sm text-[--text-muted] leading-relaxed whitespace-pre-wrap">
                                {launch.notes || "No notes provided for this campaign."}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat (Right) */}
                <div className="col-span-4 bg-[--bg-surface] flex flex-col h-full border-l border-[--border] overflow-hidden">
                    <div className="p-4 border-b border-[--border] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[--success]"></div>
                            <span className="font-bold text-sm">#campaign-internal</span>
                        </div>
                        <MoreHorizontal size={16} className="text-[--text-muted]" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {launch.messages && launch.messages.length > 0 ? (
                            launch.messages.map((msg) => (
                                msg.isSystem ? (
                                    // System message - centered, no avatar
                                    <div key={msg.id} className="flex flex-col items-center justify-center w-full gap-1 my-1">
                                        <div className="text-xs text-[--text-muted] italic bg-[--bg-app] px-4 py-1.5 rounded-full border border-[--border] text-center">
                                            {msg.text.includes(' by ') ? (
                                                <>
                                                    <div className="text-[--text] font-medium opacity-90">{msg.text.substring(0, msg.text.indexOf(' by '))}</div>
                                                    <div>{msg.text.substring(msg.text.indexOf(' by ') + 1)}</div>
                                                </>
                                            ) : (
                                                msg.text
                                            )}
                                        </div>
                                        {(msg.date || msg.time) && (
                                            <span className="text-[10px] text-[--text-muted] opacity-60 font-medium tracking-wide">
                                                {msg.date ? `${msg.date} at ${msg.time}` : msg.time}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    // Regular user message
                                    <div key={msg.id} className={`flex gap-3 ${msg.userId === user?.id || msg.user === 'You' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden ${msg.userId === user?.id || msg.user === 'You' ? 'bg-[#e25fe2] text-white shadow-[0_0_15px_rgba(226,95,226,0.3)]' : 'bg-[--bg-card] border border-[--border]'}`}>
                                            {(() => {
                                                // Use globally synced avatar from context, or fallback to current user session if it's "me" and context is lagging
                                                const avatarUrl = msg.avatarUrl || (msg.userId === user?.id ? user?.user_metadata?.avatar_url : null);

                                                if (avatarUrl) {
                                                    return <img src={avatarUrl} alt={msg.user} className="w-full h-full object-cover" />;
                                                }

                                                return (msg.userId === user?.id || msg.user === 'You') ? 'Y' : msg.user.charAt(0);
                                            })()}
                                        </div>
                                        <div className={`flex flex-col ${msg.userId === user?.id || msg.user === 'You' ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold">{(msg.userId === user?.id || msg.user === 'You') ? 'You' : msg.user}</span>
                                                <span className="text-[10px] text-[--text-muted]">{msg.time}</span>
                                            </div>

                                            {/* Text message */}
                                            {msg.text && (
                                                <div className={`p-3 rounded-xl text-sm max-w-[280px] leading-relaxed
                                            ${msg.userId === user?.id || msg.user === 'You'
                                                        ? 'bg-[#e25fe2] text-white font-medium shadow-[0_0_15px_rgba(226,95,226,0.3)] rounded-tr-none'
                                                        : 'bg-[--bg-card] border border-[--border] text-[--text-main] rounded-tl-none'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                            )}

                                            {/* Attachment */}
                                            {msg.attachment && (
                                                <div className="mt-2">
                                                    {msg.attachment.type === 'image' ? (
                                                        <img
                                                            src={msg.attachment.url}
                                                            alt={msg.attachment.name}
                                                            className="max-w-[280px] rounded-lg border border-[--border] cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => {
                                                                setModalImageUrl(msg.attachment.url);
                                                                setImageModalOpen(true);
                                                            }}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={msg.attachment.url}
                                                            download={msg.attachment.name}
                                                            className="flex items-center gap-2 p-3 bg-[--bg-card] border border-[--border] rounded-lg hover:bg-[--bg-surface] transition-colors max-w-[280px]"
                                                        >
                                                            <FileText size={20} className="text-[--primary] flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-medium truncate">{msg.attachment.name}</div>
                                                                <div className="text-[10px] text-[--text-muted]">
                                                                    {(msg.attachment.size / 1024).toFixed(1)} KB
                                                                </div>
                                                            </div>
                                                            <Download size={16} className="text-[--text-muted] flex-shrink-0" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div className="text-center text-[--text-muted] text-sm mt-10">
                                No messages yet. Start the conversation!
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-[--bg-app] border-t border-[--border]">
                        {/* File Preview */}
                        {selectedFile && (
                            <div className="mb-3 p-3 bg-[--bg-surface] border border-[--border] rounded-lg flex items-center gap-3">
                                {filePreview ? (
                                    <img src={filePreview} alt="Preview" className="w-16 h-16 rounded object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded bg-[--bg-card] flex items-center justify-center">
                                        <FileText size={24} className="text-[--primary]" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{selectedFile.name}</div>
                                    <div className="text-[10px] text-[--text-muted]">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    className="p-1 hover:bg-[--bg-card] rounded transition-colors"
                                >
                                    <X size={16} className="text-[--text-muted]" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="relative">
                            {showMentions && filteredProfiles.length > 0 && (
                                <div className="absolute bottom-full mb-2 left-0 w-64 bg-[--bg-card] border border-[--border] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="p-2 text-xs text-[--text-muted] border-b border-[--border] bg-[--bg-surface]">
                                        Mention Member
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredProfiles.map(profile => (
                                            <button
                                                key={profile.id}
                                                type="button"
                                                onClick={() => handleMentionSelect(profile)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-[--bg-surface] transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[--primary]/20 flex items-center justify-center text-[--primary] font-bold text-xs overflow-hidden">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (profile.full_name || profile.username || 'U').charAt(0)
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{profile.full_name || profile.username || 'Unknown'}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <input
                                type="text"
                                className="w-full bg-[--bg-surface] border border-[--border] rounded-xl pl-4 pr-12 py-3 text-sm focus:border-[--primary] transition-all"
                                placeholder="Type a message... (@ to mention)"
                                value={composedMessage}
                                onChange={handleInputChange}
                                disabled={isUploading}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 p-1.5 bg-[--primary] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                            </button>
                        </form>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="flex justify-between mt-2 px-1">
                            <div className="flex gap-3 text-[--text-muted]">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="hover:text-[--text-main] transition-colors"
                                    disabled={isUploading}
                                >
                                    <Paperclip size={14} />
                                </button>
                            </div>
                            <span className="text-[10px] text-[--text-muted]">Press Enter to send</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {imageModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setImageModalOpen(false)}
                >
                    <button
                        onClick={() => setImageModalOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>
                    <img
                        src={modalImageUrl}
                        alt="Full size preview"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};


const ResourceCard = ({ icon, title, value, color, isEditing, onChange }) => {
    const CardContent = () => (
        <>
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate mb-0.5">{title}</h3>
                {isEditing ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="text-xs bg-[--bg-app] border border-[--border] rounded p-1 w-full text-[--text-main] focus:border-[--primary] outline-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="text-xs text-[--text-muted] truncate group-hover:text-[--primary]">
                        {value && !value.includes('/placeholder') && !value.includes('example.com/landing') && value !== '[Add Link Here]' ? value : '[Add Link Here]'}
                    </div>
                )}
            </div>
            {!isEditing && (
                <div className="w-8 h-8 rounded-full bg-[--bg-app] flex items-center justify-center text-[--text-muted] group-hover:bg-[--primary] group-hover:text-white transition-colors">
                    <ArrowLeft size={12} className="rotate-180" />
                </div>
            )}
        </>
    );

    const baseClasses = `card bg-[--bg-surface] p-3 flex items-center gap-4 transition-colors ${!isEditing ? 'hover:border-[--primary] group cursor-pointer' : ''}`;
    const href = value.startsWith('http') ? value : `https://${value}`;

    if (isEditing) {
        return (
            <div className={baseClasses}>
                <CardContent />
            </div>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseClasses} block decoration-0`}
        >
            <CardContent />
        </a>
    );
};

export default LaunchDetails;
