import React from 'react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [videoOpen, setVideoOpen] = React.useState(false);

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay active fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
                <div className="modal-content bg-white dark:bg-gray-800 w-[800px] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">Help & Support</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Resources to help you get started</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Useful Resources</h3>
                            <div className="space-y-3">
                                {['Documentation', 'API Reference', 'Community Forum', 'GitHub Repository'].map(item => (
                                    <a key={item} href="#" className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm transition-all group">
                                        <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors mb-1">{item}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Link description...</div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Video Tutorial</h3>
                            <button
                                onClick={() => setVideoOpen(true)}
                                className="w-full bg-gray-900 dark:bg-gray-950 rounded-lg aspect-video flex items-center justify-center mb-4 relative group cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                            >
                                <img src="/tutorial_thumbnail.png" alt="Video Tutorial" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-primary/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                    <p className="text-white text-xs font-medium drop-shadow-md">Watch Tutorial</p>
                                </div>
                            </button>

                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Need Help?</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Contact our support team at</p>
                                <a href="mailto:support@annotaloop.com" className="text-sm font-medium text-primary hover:underline">support@annotaloop.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Modal Popup */}
            {videoOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 animate-fade-in p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 relative p-6">
                        <button
                            onClick={() => setVideoOpen(false)}
                            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <div className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Tutorials Available</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Video tutorials and demos are available on our website and documentation.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="https://github.com/tayyab-nlp/AnnotaLoop"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                    Visit GitHub Repository
                                </a>
                                <button
                                    onClick={() => setVideoOpen(false)}
                                    className="block w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpModal;
