import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FileTabsNavigation } from '../components/projectComponents/FileTabsNavigation';
import { Editor } from '../components/projectComponents/Editor';
import { Preview } from '../components/projectComponents/Preview';
import { CollapseButton } from '../components/projectComponents/Buttons';
import { ProjectNavBar } from '../components/NavBar';
import { ProjectDescription } from '../components/projectComponents/ProjectDescription';
import { useParams } from 'react-router-dom';

import { File} from "../utils/types" 
import { useProjectDetail, useMultipleFileDetails, useProjectOperations} from '../utils/api';
import { useFileOperations } from '../utils/api';
import {mapProject, mapFile} from "../utils/mappers";

const generatePreview = (files: File[], activeFileID: File["id"]): string => {
  const htmlFile = files.find((file) => file.id === activeFileID);
  const cssFiles = files.filter((file) => file.file_name.endsWith(".css"));
  const jsFiles = files.filter((file) => file.file_name.endsWith(".js"));

  const htmlContent = htmlFile ? htmlFile.content : '';
  const cssContent = cssFiles.map(file => file.content).join('\n');
  const jsContent = jsFiles.map(file => file.content).join('\n');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Preview</title>
        <style>${cssContent}</style>
        <script>
          document.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.target.href) {
              e.preventDefault();
              const filename = e.target.getAttribute('href');
              window.parent.postMessage({ type: 'navigate', file: filename }, '*');
            }
          });
        </script>
      </head>
      <body>
        ${htmlContent}
        <script>${jsContent}</script>
      </body>
    </html>
  `;
};

const ProjectEditor: React.FC = () => {
  /* 
    The useProjectdetail gets file metadata(file name, file url, etc) and project metadata(name, description, etc)
    The content fetched is handled in useMultipleFileDetails
    */
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { data } = useProjectDetail(projectId);
  const project = data ? mapProject(data) : null;
  // Use useMemo to create a stable array of file IDs
  const fileIds = useMemo(() => {
    return project?.files?.map((file) => file.id) || [];
  }, [project]);
  //Get actual file contents
  //used in editor
  const fileDetailResults = useMultipleFileDetails(fileIds);

  const fetchedFileContents = useMemo(() => {
    return fileDetailResults
      .map((result) => {
        if (result.isLoading) return "Loading...";
        if (result.error) return "Error loading file";
        return mapFile(result.data);
      })
      .filter((file) => typeof file !== "string");
  }, [fileDetailResults]);

  
  //data for display
  const [activeFileID, setActiveFileID] = useState(fileIds[0] || 0);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  useEffect(() => {
    setLocalFiles(fetchedFileContents);
  }, [fetchedFileContents]);
  // let localFiles = useMemo(() => {
  //   return fetchedFileContents;
  // }, [fetchedFileContents]);

  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isCollapsedFileTab, setIsCollapsedFileTab] = useState<boolean>(false);
  const [isCollapsedPreview, setIsCollapsedPreview] = useState<boolean>(false);
  const [isCollapsedDesc, setIsCollapsedDesc] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {handleProjectRename, handleProjectChangeDescription, error:projectError} = useProjectOperations(projectId)
  const { handleFileSave } = useFileOperations(projectId);
  const preview = useMemo(() => {
    if (localFiles && localFiles.length > 0) {
      return generatePreview(localFiles, activeFileID);
    }
    return "";
  }, [localFiles, activeFileID]);

  const handleNavigate = (filename: string) => {
    const file = fetchedFileContents.find(
      (file) => file.file_name === filename
    );
    if (file) {
      setActiveFileID(file.id);
    }
  };
  const onSave = useCallback(async (content: string) => {
    try{
      await handleFileSave(activeFileID, content);
    }catch(e: any){
      setError(e.message);
    }
    
  }, [handleFileSave, activeFileID]);
  return (
    <>
    <ProjectNavBar isEditing={isEditing} title={project?.name || ''} onTitleChange={handleProjectRename} modifiedTime={project?.updated_at || 'NaN'}
      onCollapseDesc={() => setIsCollapsedDesc(!isCollapsedDesc)} onSwitchView={() => setIsEditing(!isEditing)}/>
    {isCollapsedDesc? <> </>: <ProjectDescription description={project?.description || ''} onDescriptionChange={handleProjectChangeDescription}/>}
    
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-grow flex">
        {isEditing && //Editor mode
          <> 
          { !isCollapsedFileTab && <FileTabsNavigation
              projectId={projectId}
              files={project?.files || []}
              activeFileID={activeFileID}
              onFileSelect={setActiveFileID}
              onError={setError}/>}

            <CollapseButton
              onCollapseButtonClick={() => setIsCollapsedFileTab(!isCollapsedFileTab)}
              isCollapsed={isCollapsedFileTab}
              collapseDirection="left"
            />
          
            <Editor activeFile={localFiles.find(file => file.id === activeFileID)} onSave={onSave}/>

            <CollapseButton
              onCollapseButtonClick={() =>
                setIsCollapsedPreview(!isCollapsedPreview)
              }
              isCollapsed={isCollapsedPreview}
              collapseDirection="right"
            />
          </>
          }

          {!isCollapsedPreview && (
            <Preview previewDoc={preview} onNavigate={handleNavigate} />
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectEditor;
