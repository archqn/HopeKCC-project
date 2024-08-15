import React, { useState, useEffect, useRef } from 'react';
import { Files } from './templateFiles';
import { FileDisplayButton, AddButton, DeleteButton, RenameButton, UploadButton } from './Buttons';



interface FileTabsNavigationProps {
  files: Files;
  activeFile: string;
  onFileSelect: (filename: string) => void;
  onAddFile: () => void;
  onDeleteFile: (fileId: number, filename: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onUploadFile: () => void;
}

interface FileToolbarProps {
  activeFile: string;
  onAddFile: () => void;
  onDeleteFile: () => void;
  onRenameClick: () => void;
  onUploadFile: () => void;
}


export const FileTabsNavigation: React.FC<FileTabsNavigationProps> = ({
  files,
  activeFile,
  onFileSelect,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onUploadFile
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navigationRef.current && !navigationRef.current.contains(event.target as Node)) {
        setIsRenaming(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRename = (oldName: string, newName: string) => {
    onRenameFile(oldName, newName);
    setIsRenaming(false);
  };

  const activeFileId = files[activeFile]?.id || null;  // Get the ID of the active file

  return (
    <div
      ref={navigationRef}
      className={'flex flex-col bg-gray-200 transition-all duration-300 ease-in-out w-1/2 overflow-y-auto'}
    >
      <FileToolbar 
        onAddFile={onAddFile} 
        onDeleteFile={() => onDeleteFile(activeFileId!, activeFile)} 
        onRenameClick={() => setIsRenaming(true)}
        activeFile={activeFile} 
        onUploadFile={onUploadFile}
      />
      {Object.keys(files).map((filename) => (
        <div key={filename} className="flex items-center">
          <FileDisplayButton
            filename={filename}
            onFileSelect={onFileSelect}
            onRename={handleRename}
            onCancelRename={() => setIsRenaming(false)}
            onDoubleClick={() => setIsRenaming(true)}
            isActive={activeFile === filename}
            isRenaming={activeFile === filename && isRenaming}
          />
        </div>
      ))}
    </div>
  );
};

export const FileToolbar: React.FC<FileToolbarProps> = ({
  onAddFile,
  onDeleteFile,
  onRenameClick,
  onUploadFile,
}) => {
  return (
    <div className='text-black bg-gray-300 px-1 flex justify-start'>
      <AddButton onClick={onAddFile} className='hover:bg-gray-500'/>
      <UploadButton onClick={onUploadFile} className='hover:bg-gray-500'/>        
      <DeleteButton onClick={onDeleteFile} className='hover:bg-gray-500'/>
      <RenameButton onClick={onRenameClick} className='hover:bg-gray-500'/>
    </div>
  );
};