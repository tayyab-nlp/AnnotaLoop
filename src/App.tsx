import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ProjectDetail from './components/project/ProjectDetail';
import type { Project, DeleteType, Document as AppDocument } from './context/types';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';
import { useProjectExportImport } from './hooks/useProjectExportImport';
import { UpdaterBanner } from './UpdaterBanner';

// Modals
import ProjectModal from './components/modals/ProjectModal';
import SettingsModal from './components/modals/SettingsModal';
import HelpModal from './components/modals/HelpModal';
import AboutModal from './components/modals/AboutModal';

import ProjectExportModal from './components/modals/ProjectExportModal';
import ProjectImportModal from './components/modals/ProjectImportModal';
import DeleteModal from './components/modals/DeleteModal';
import UploadModal from './components/modals/UploadModal';
import ConfigModal from './components/modals/ConfigModal';
import AnnotationPage from './components/annotation/AnnotationPage';
import GlobalBatchBadge from './components/modals/GlobalBatchBadge';
import BatchProcessingModal from './components/modals/BatchProcessingModal';

const AppContent = () => {
  const {
    currentProject,
    projects, setProjects,
    documents, setDocuments,
    deleteType, setDeleteType,
    deleteTarget, setDeleteTarget,
    setCurrentProject,
    annotatingDocId,
    selectedDocs, setSelectedDocs,
    showToast,
    batchState, setBatchState
  } = useApp();

  // Modal States
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Export/Import Hook
  const exportImport = useProjectExportImport();

  // Auxiliary state for modals
  const [configProjectId, setConfigProjectId] = useState<number | null>(null);
  const [uploadInitialFiles, setUploadInitialFiles] = useState<File[]>([]);

  // Tauri Window Resize and Initialization
  useEffect(() => {
    // Check if Tauri logic is safe
    try {
      if (isTauri()) {
        const initTauri = async () => {
          try {
            const appWindow = getCurrentWindow();
            // Safety check for v2 API or shim differences
            const monitor = (typeof (appWindow as any).currentMonitor === 'function')
              ? await (appWindow as any).currentMonitor()
              : null;
            if (monitor) {
              const { width: screenWidth, height: screenHeight } = monitor.size;
              const width = Math.round(screenWidth * 0.85);
              const height = Math.round(screenHeight * 0.80);
              await appWindow.setSize(new PhysicalSize(width, height));
              await appWindow.center();
            }

            // Initialize Tauri file storage
            const { initTauriFileStorage } = await import('./utils/tauriFileStorage');
            await initTauriFileStorage();

            // Migrate API keys to secure storage
            const { migrateApiKeys } = await import('./utils/secureStorage');
            await migrateApiKeys();
          } catch (e) {
            console.error("Failed to initialize Tauri services", e);
          }
        };
        initTauri();
      }
    } catch (e) {
      // Fallback if isTauri throws
    }
  }, []);

  // Handlers
  const handleOpenCreateProject = () => {
    setEditProject(null);
    setProjectModalOpen(true);
  };

  const handleOpenEditProject = (id: number) => {
    const p = projects.find(pr => pr.id === id);
    if (p) {
      setEditProject(p);
      setProjectModalOpen(true);
    }
  };

  const handleOpenConfig = (id: number) => {
    setConfigProjectId(id);
    setConfigModalOpen(true);
  };

  const handleOpenProjectExport = (id: number) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      exportImport.handleOpenProjectExport(project);
    }
  };

  // Handle document export (and batch export when id=0 and batch=true)
  const handleOpenDocumentExport = (id: number, batch: boolean = false) => {
    if (batch) {
      // Batch export - get selected documents
      const selectedDocsList = documents.filter(d => selectedDocs.has(d.id));
      if (selectedDocsList.length > 0) {
        exportImport.handleExportBatch(selectedDocsList);
      }
    } else {
      // Single document export
      const doc = documents.find(d => d.id === id);
      if (doc) {
        exportImport.handleExportDocument(doc);
      }
    }
  };

  const handlePromptDelete = (type: DeleteType, id: number = 0) => {
    setDeleteType(type);
    setDeleteTarget(type !== 'batch' ? id : 0);
  };

  const handleConfirmDelete = async () => {
    const { deleteTauriFile, getFileExtension } = await import('./utils/tauriFileStorage');

    if (deleteType === 'project') {
      // Get all documents for this project to clean up their files
      const projectDocs = documents.filter((d: AppDocument) => d.projectId === deleteTarget);

      // Delete each document's files from storage
      for (const doc of projectDocs) {
        if (doc.storageId && doc.name) {
          const ext = getFileExtension(doc.name);
          try {
            await deleteTauriFile(doc.storageId, ext, false); // Original
            await deleteTauriFile(doc.storageId, ext, true);  // Annotated
          } catch (e) {
            console.warn('Failed to delete file for document:', doc.id, e);
          }
        }
      }

      // Remove documents from state
      setDocuments((prev: AppDocument[]) => prev.filter((d: AppDocument) => d.projectId !== deleteTarget));
      setProjects(prev => prev.filter(p => p.id !== deleteTarget));
      if (currentProject && currentProject.id === deleteTarget) {
        setCurrentProject(null);
      }
      showToast('success', 'Project Deleted', 'The project and its documents have been removed.');
    } else if (deleteType === 'document') {
      // Find document to get its storage info
      const doc = documents.find((d: AppDocument) => d.id === deleteTarget);
      if (doc?.storageId && doc?.name) {
        const ext = getFileExtension(doc.name);
        try {
          await deleteTauriFile(doc.storageId, ext, false);
          await deleteTauriFile(doc.storageId, ext, true);
        } catch (e) {
          console.warn('Failed to delete file for document:', doc.id, e);
        }
      }
      setDocuments((prev: AppDocument[]) => prev.filter((d: AppDocument) => d.id !== deleteTarget));
      showToast('success', 'Document Deleted', 'File removed successfully.');
    } else if (deleteType === 'batch') {
      const count = selectedDocs.size;
      // Delete files for all selected documents
      const docsToDelete = documents.filter((d: AppDocument) => selectedDocs.has(d.id));
      for (const doc of docsToDelete) {
        if (doc.storageId && doc.name) {
          const ext = getFileExtension(doc.name);
          try {
            await deleteTauriFile(doc.storageId, ext, false);
            await deleteTauriFile(doc.storageId, ext, true);
          } catch (e) {
            console.warn('Failed to delete file for document:', doc.id, e);
          }
        }
      }
      setDocuments((prev: AppDocument[]) => prev.filter((d: AppDocument) => !selectedDocs.has(d.id)));
      setSelectedDocs(new Set());
      showToast('success', 'Batch Delete', `${count} documents deleted.`);
    }
    setDeleteType(null);
    setDeleteTarget(null);
  };



  const handleDirectUpload = async (files: File[]) => {
    if (!currentProject) return;

    const newDocs: any[] = [];
    const { saveFileToStorage } = await import('./utils/fileStorage');
    const { extractText, formatTokenCount } = await import('./services/TextExtractionService');

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let type = 'pdf';
      if (f.type.includes('image')) type = 'image';
      else if (f.type.includes('text') || f.name.endsWith('.md') || f.name.endsWith('.txt')) type = 'text';
      else if (f.name.endsWith('.docx') || f.name.endsWith('.doc')) type = 'word';

      let storageId;
      try {
        storageId = await saveFileToStorage(f);
      } catch (e) {
        console.error('Failed to save file', e);
      }

      // Extract text and calculate tokens
      let extractedText = '';
      let tokenCount = 0;
      let tokenDisplay = '~0';

      try {
        const extraction = await extractText(f);
        extractedText = extraction.text;
        tokenCount = extraction.tokenCount;
        tokenDisplay = formatTokenCount(tokenCount);
      } catch (e) {
        console.error('Failed to extract text', e);
      }

      newDocs.push({
        id: Date.now() + i,
        name: f.name,
        status: 'Ready',
        projectId: currentProject?.id || 0,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        tokens: tokenDisplay,
        tokenCount,
        extractedText,
        date: new Date().toLocaleDateString('en-US'),
        fileUrl: URL.createObjectURL(f),
        fileType: type,
        storageId,
        // Inherit labels and rules from project
        labels: currentProject?.labels || [],
        rules: currentProject?.rules || []
      });

    }

    setDocuments((prev: AppDocument[]) => [...newDocs, ...prev]);
    showToast('success', 'Upload Complete', `${files.length} documents added.`);
  };


  const handleStageUpload = (files: File[]) => {
    setUploadInitialFiles(files);
    setUploadModalOpen(true);
  };

  // Handle viewing sample project - imports bundled sample and navigates to it
  const handleViewSampleProject = async () => {
    try {
      const importFunctions = await import('./utils/exportImport');
      const { exists } = await import('@tauri-apps/plugin-fs');

      // Use direct path for dev environment
      const samplePath = '/Users/mdtayyab/Documents/anotaloopv2 copy/sample-project/Methods–Claims Alignment.alproj';

      // Verify file exists first
      const fileExists = await exists(samplePath);
      if (!fileExists) {
        showToast('error', 'Sample Not Found', 'Sample project file not found at expected location.');
        return;
      }

      const nextProjectId = Math.max(...projects.map(p => p.id), 0) + 1;
      const nextDocumentId = Date.now();
      const existingProjectNames = projects.map(p => p.name);
      const existingDocNames = documents.map(d => d.name);

      const result = await importFunctions.importProject(
        samplePath,
        undefined, // no password
        nextProjectId,
        nextDocumentId,
        existingProjectNames,
        existingDocNames
      );

      if (result.success && result.data) {
        setProjects(prev => [...prev, result.data.project]);
        setDocuments((prev: AppDocument[]) => [...prev, ...result.data.documents]);
        setCurrentProject(result.data.project);
        showToast('success', 'Sample Project Loaded', 'Explore the sample to learn how AnnotaLoop works!');
      } else {
        showToast('error', 'Failed to Load', result.error || 'Could not load sample project.');
      }
    } catch (error) {
      console.error('Failed to load sample project:', error);
      showToast('error', 'Error', error instanceof Error ? error.message : 'Could not load sample project.');
    }
  };




  return (
    <Layout
      onOpenProjectModal={handleOpenCreateProject}
      onOpenSettingsModal={() => setSettingsModalOpen(true)}
      onOpenHelpModal={() => setHelpModalOpen(true)}
      onOpenAboutModal={() => setAboutModalOpen(true)}
      onOpenImportModal={exportImport.handleOpenProjectImport}
      hideHeader={configProjectId === null && annotatingDocId !== null || (!currentProject && projects.length === 0)}
    >
      <UpdaterBanner />
      {configProjectId === null && annotatingDocId !== null ? (
        <AnnotationPage />
      ) : currentProject ? (
        <ProjectDetail
          onOpenConfigModal={handleOpenConfig}
          onOpenUploadModal={() => { setUploadInitialFiles([]); setUploadModalOpen(true); }}
          onOpenExportModal={handleOpenDocumentExport}
          onPromptDelete={handlePromptDelete}
          onOpenEditProjectModal={handleOpenEditProject}
          onUploadFiles={handleStageUpload}
          onOpenDocumentImport={exportImport.handleOpenDocumentImport}
        />
      ) : (
        <Dashboard
          onOpenProjectModal={handleOpenCreateProject}
          onOpenConfigModal={handleOpenConfig}
          onOpenExportModal={handleOpenProjectExport}
          onPromptDelete={handlePromptDelete}
          onOpenImportModal={exportImport.handleOpenProjectImport}
          onViewSampleProject={handleViewSampleProject}
        />
      )}

      {/* Modals */}
      <ProjectModal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} editProject={editProject} />
      <SettingsModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />

      <DeleteModal isOpen={!!deleteType} onClose={() => setDeleteType(null)} onConfirm={handleConfirmDelete} type={deleteType} count={selectedDocs.size} />
      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUpload={handleDirectUpload} initialFiles={uploadInitialFiles} />
      <ConfigModal
        isOpen={configModalOpen}
        onClose={() => { setConfigModalOpen(false); setConfigProjectId(null); }}
        projectId={configProjectId}
        onExportLabels={exportImport.handleExportLabels}
        onImportLabels={exportImport.handleImportLabels}
        onExportRules={exportImport.handleExportRules}
        onImportRules={exportImport.handleImportRules}
      />

      {/* New Project Export/Import Modals */}
      <ProjectExportModal
        isOpen={exportImport.projectExportModalOpen}
        onClose={() => exportImport.setProjectExportModalOpen(false)}
        onExport={exportImport.handleProjectExport}
        exportType={exportImport.exportType}
        defaultFilename={exportImport.exportFilename}
      />
      <ProjectImportModal
        isOpen={exportImport.projectImportModalOpen}
        onClose={() => exportImport.setProjectImportModalOpen(false)}
        onImport={exportImport.handleProjectImport}
        importType={exportImport.importType}
      />

      {/* Global Batch Processing Badge - visible on all pages when minimized */}
      <GlobalBatchBadge />

      {/* Global Batch Processing Modal - persistent across pages */}
      {batchState.isActive && (
        <BatchProcessingModal
          isOpen={true} // Controlled by batchState.isActive validity
          documentIds={batchState.documentIds}
          onClose={() => setBatchState(prev => ({ ...prev, isActive: false, status: 'idle' }))}
          onUpdateDocIds={(ids) => setBatchState(prev => ({ ...prev, documentIds: ids, total: ids.length }))}
        />
      )}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
