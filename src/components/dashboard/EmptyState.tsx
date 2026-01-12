import React from 'react';
import { Plus, Upload, PlayCircle, LayoutTemplate } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import workflowIllustration from '../../assets/workflow-illustration.png';
import workflowIllustrationDark from '../../assets/workflow-illustration-dark.png';

interface EmptyStateProps {
    onCreateProject: () => void;
    onImportProject: () => void;
    onViewSampleProject?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateProject, onImportProject, onViewSampleProject }) => {
    const handleWatchDemo = async () => {
        try {
            await open('https://tayyab.io/annotaloop/#video-complete-workflow');
        } catch (error) {
            console.error('Failed to open demo video link:', error);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center animate-fade-in pb-10">
            <div className="w-full max-w-4xl text-center space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Welcome to AnnotaLoop
                    </h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
                        AI-assisted document annotation with{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                            human-in-the-loop
                        </span>{' '}
                        workflows
                    </p>
                </div>

                {/* Workflow Diagram */}
                <div className="flex flex-col items-center justify-center py-4">
                    {/* Light theme version */}
                    <img
                        src={workflowIllustration}
                        alt="AnnotaLoop Workflow: Document → AI Suggests → Human Reviews → Structured Output"
                        className="max-w-full md:max-w-2xl h-auto object-contain opacity-70 dark:hidden"
                    />
                    {/* Dark theme version */}
                    <img
                        src={workflowIllustrationDark}
                        alt="AnnotaLoop Workflow: Document → AI Suggests → Human Reviews → Structured Output"
                        className="max-w-full md:max-w-2xl h-auto object-contain opacity-70 hidden dark:block"
                    />
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-1">
                    <button
                        onClick={onCreateProject}
                        className="bg-[#0F8A7D] hover:bg-[#0c7068] text-white px-10 py-3 rounded-lg text-base font-semibold shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 mx-auto min-w-[200px]"
                    >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        New Project
                    </button>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <button
                            onClick={onImportProject}
                            className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors inline-flex items-center gap-2 group"
                        >
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            Or import an existing project
                        </button>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-6 pt-4 max-w-md mx-auto">
                    <button
                        onClick={onViewSampleProject}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        <LayoutTemplate className="w-4 h-4" />
                        View sample project
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
                    <button
                        onClick={handleWatchDemo}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        <PlayCircle className="w-4 h-4" />
                        Watch video demo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmptyState;