import React, { useState } from 'react';
import { X, ExternalLink, Mail, Globe, FileText, Bug, Video, BookOpen, MessageCircle } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'tutorials' | 'resources' | 'contact';

const VIDEO_TUTORIALS = [
    {
        title: 'Start Your First Project',
        description: 'Create project, configure labels, annotate with AI, review, and export',
        duration: '~6 min',
        link: 'https://tayyab.io/projects/annotaloop/#video-complete-workflow'
    },
    {
        title: 'LLM Setup Guide',
        description: 'Install and configure Ollama, LM Studio, or cloud LLMs',
        duration: '~4 min',
        link: 'https://tayyab.io/projects/annotaloop/#video-llm-setup'
    },
    {
        title: 'Batch Processing',
        description: 'Annotate multiple documents efficiently with batch workflows',
        duration: '~3 min',
        link: 'https://tayyab.io/projects/annotaloop/#video-batch-processing'
    },
    {
        title: 'Import & Export Projects',
        description: 'Share projects, backup data, and export in multiple formats',
        duration: '~3 min',
        link: 'https://tayyab.io/projects/annotaloop/#video-import-export'
    }
];

const RESOURCES = [
    {
        icon: BookOpen,
        title: 'Documentation',
        description: 'Complete guide, features, and troubleshooting',
        link: 'https://github.com/tayyab-nlp/AnnotaLoop#readme'
    },
    {
        icon: FileText,
        title: 'GitHub Repository',
        description: 'View source code, star the repo, and contribute',
        link: 'https://github.com/tayyab-nlp/AnnotaLoop'
    },
    {
        icon: Bug,
        title: 'Report an Issue',
        description: 'Found a bug or have a feature request?',
        link: 'https://github.com/tayyab-nlp/AnnotaLoop/issues'
    }
];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('tutorials');

    const openExternal = async (url: string) => {
        try {
            await open(url);
        } catch (error) {
            console.error('Failed to open external link:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
            <div className="modal-content bg-white dark:bg-gray-800 w-[800px] h-[550px] rounded-xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Sidebar */}
                <div className="w-56 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Help & Support</h3>
                    <ul className="space-y-1">
                        <li
                            onClick={() => setActiveTab('tutorials')}
                            className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'tutorials'
                                ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Video className="w-4 h-4" />
                            Video Tutorials
                        </li>
                        <li
                            onClick={() => setActiveTab('resources')}
                            className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'resources'
                                ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Useful Resources
                        </li>
                        <li
                            onClick={() => setActiveTab('contact')}
                            className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'contact'
                                ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Get in Touch
                        </li>
                    </ul>
                </div>

                {/* Content */}
                <div className="flex-grow p-6 overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>

                    {/* Video Tutorials Tab */}
                    {activeTab === 'tutorials' && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">Video Tutorials</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Master AnnotaLoop in 15 minutes</p>

                            <div className="grid grid-cols-2 gap-4">
                                {VIDEO_TUTORIALS.map((video, index) => (
                                    <button
                                        key={index}
                                        onClick={() => openExternal(video.link)}
                                        className="group p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-all duration-200 hover:shadow-md hover:border-primary"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <Video className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary" />
                                        </div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{video.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{video.description}</p>
                                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">{video.duration}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => openExternal('https://tayyab.io/projects/annotaloop')}
                                className="mt-6 flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                View all tutorials and features
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Useful Resources Tab */}
                    {activeTab === 'resources' && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">Useful Resources</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Documentation and community links</p>

                            <div className="space-y-3">
                                {RESOURCES.map((resource, index) => {
                                    const Icon = resource.icon;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => openExternal(resource.link)}
                                            className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 group"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-primary/10">
                                                <Icon className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{resource.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{resource.description}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Get in Touch Tab */}
                    {activeTab === 'contact' && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">Get in Touch</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Have questions, feedback, or just want to say hi?</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => openExternal('mailto:hello@tayyab.io')}
                                    className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 group"
                                >
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-primary/10">
                                        <Mail className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">Email Me</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">hello@tayyab.io</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                </button>

                                <button
                                    onClick={() => openExternal('https://tayyab.io')}
                                    className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 group"
                                >
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-primary/10">
                                        <Globe className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">My Portfolio</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">tayyab.io</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                </button>

                                <button
                                    onClick={() => openExternal('https://github.com/tayyab-nlp')}
                                    className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 group"
                                >
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-primary/10">
                                        <svg className="w-5 h-5 text-gray-500 group-hover:text-primary" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">GitHub</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">github.com/tayyab-nlp</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
