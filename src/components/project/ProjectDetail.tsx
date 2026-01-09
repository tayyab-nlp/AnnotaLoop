import React, { useState, useRef, type DragEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Upload, Search, Edit, Download } from 'lucide-react';
import DocumentGrid from './DocumentGrid';
import DocumentTable from './DocumentTable';
import BatchActionsBar from './BatchActionsBar';
import CustomSelect from '../ui/CustomSelect';
import ProjectOnboardingFlow from './ProjectOnboardingFlow';

interface ProjectDetailProps {
    onOpenConfigModal: (id: number) => void;
    onOpenUploadModal: () => void;
    onUploadFiles: (files: File[]) => void;
    onOpenExportModal: (id: number, batch?: boolean) => void;
    onPromptDelete: (type: 'document' | 'batch', id?: number) => void;
    onOpenEditProjectModal: (id: number) => void;
    onOpenDocumentImport?: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
    onOpenConfigModal,
    onOpenUploadModal,
    onUploadFiles,
    onOpenExportModal,
    onPromptDelete,
    onOpenEditProjectModal,
    onOpenDocumentImport
}) => {
    const { currentProject, documents, view, setView, documentFilter, setDocumentFilter, documentSearchQuery, setDocumentSearchQuery, selectedDocs, setSelectedDocs, setBatchState } = useApp();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!currentProject) return null;

    // Filter documents and sort by date (newest first)
    const projectDocs = documents.filter(d => d.projectId === currentProject.id);
    const filteredDocs = projectDocs
        .filter(d => {
            const matchesStatus = documentFilter === 'All' || d.status === documentFilter;
            const matchesSearch = d.name.toLowerCase().includes(documentSearchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUploadFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUploadFiles(Array.from(e.target.files));
        }
    };

    return (
        <div id="project-detail-view" className="h-full flex flex-col">
            {/* Header/Info */}
            <div className="mb-6 flex justify-between items-start">
                <div className="w-full">
                    <div className="flex items-center gap-2 group mb-1">
                        <h2
                            className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:underline decoration-dashed decoration-gray-400 underline-offset-4"
                            onClick={() => onOpenEditProjectModal(currentProject.id)}
                        >
                            {currentProject.name}
                        </h2>
                        <button onClick={() => onOpenEditProjectModal(currentProject.id)} className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-start gap-2 group w-full max-w-2xl">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {currentProject.desc || 'No description provided'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    {currentProject.labels.length > 0 && (
                        <>
                            <button onClick={() => onOpenConfigModal(currentProject.id)} title="Project Configuration" className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md font-medium shadow-sm flex items-center gap-2 transition-colors">
                                <Settings className="w-4 h-4" />
                                <span>Configure</span>
                            </button>
                            {onOpenDocumentImport && (
                                <button
                                    onClick={onOpenDocumentImport}
                                    title="Import Document"
                                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md font-medium shadow-sm flex items-center gap-2 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Import
                                </button>
                            )}
                            <button
                                onClick={onOpenUploadModal}
                                title="Upload Documents"
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md font-medium shadow-sm flex items-center gap-2 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Docs
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Document Content */}
            {projectDocs.length === 0 ? (
                // Show onboarding flow if no labels configured, otherwise show simple upload area
                currentProject.labels.length === 0 ? (
                    <ProjectOnboardingFlow
                        hasLabels={false}
                        onOpenConfigModal={() => onOpenConfigModal(currentProject.id)}
                        onOpenUploadModal={onOpenUploadModal}
                    />
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-start pt-24 px-4 animate-in fade-in duration-500">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.docx,.doc,.txt,.md"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />

                        <div
                            className={`w-full max-w-lg rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${isDragging
                                ? 'bg-primary/5 scale-[1.02]'
                                : 'bg-white dark:bg-gray-800/40'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleBoxClick}
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 mx-auto transition-colors ${isDragging
                                ? 'bg-primary/20 text-primary'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                                }`}>
                                <Upload className="w-5 h-5" />
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {isDragging ? 'Drop files to upload' : 'Upload documents to start annotating'}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                {isDragging
                                    ? 'Release to upload your documents'
                                    : 'Click to browse or drag & drop files here'
                                }
                            </p>

                            {/* Supported formats */}
                            {!isDragging && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    PDF, DOCX, DOC, TXT, MD
                                </p>
                            )}
                        </div>
                    </div>
                )
            ) : (
                <>
                    {/* Search & Filter */}
                    <div className="mb-4 flex justify-between items-center gap-4">
                        <div className="relative flex-grow max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents by name..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={documentSearchQuery}
                                onChange={(e) => setDocumentSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</label>
                            <div className="w-40 z-20">
                                <CustomSelect
                                    compact
                                    options={[
                                        { value: 'All', label: 'All Documents' },
                                        { value: 'Ready', label: 'Ready' },
                                        { value: 'Processing', label: 'Processing' },
                                        { value: 'Review', label: 'Review' },
                                        { value: 'Annotated', label: 'Annotated' }
                                    ]}
                                    value={documentFilter}
                                    onChange={(val) => setDocumentFilter(val)}
                                />
                            </div>
                            <div className="bg-gray-200 dark:bg-gray-700 h-8 w-[1px] mx-2"></div>
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                </button>
                                <button onClick={() => setView('table')} className={`p-1.5 rounded ${view === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <BatchActionsBar
                        onBatchDelete={() => onPromptDelete('batch')}
                        onBatchExport={() => onOpenExportModal(0, true)}
                        onBatchAnnotate={() => {
                            const ids = Array.from(selectedDocs);
                            setBatchState({
                                isActive: true,
                                isMinimized: false,
                                documentIds: ids,
                                completed: 0,
                                failed: 0,
                                total: ids.length,
                                currentDocName: '',
                                status: 'idle'
                            });
                            setSelectedDocs(new Set());
                        }}
                    />

                    <div className="flex-grow">
                        {filteredDocs.length > 0 ? (
                            view === 'grid' ? (
                                <DocumentGrid
                                    documents={filteredDocs}
                                    onOpenExportModal={(id) => onOpenExportModal(id)}
                                    onPromptDelete={(type, id) => onPromptDelete(type, id)}
                                />
                            ) : (
                                <DocumentTable
                                    documents={filteredDocs}
                                    onOpenExportModal={(id) => onOpenExportModal(id)}
                                    onPromptDelete={(type, id) => onPromptDelete(type, id)}
                                />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Search className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No documents found</h3>
                                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Batch Processing Modal moved to global App level */}
        </div>
    );
};

export default ProjectDetail;
