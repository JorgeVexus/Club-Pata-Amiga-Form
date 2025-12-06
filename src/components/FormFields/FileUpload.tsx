/**
 * Componente de File Upload con Drag & Drop
 * Soporta múltiples archivos, validación de formato y tamaño
 */

import React, { useRef, useState } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    label: string;
    name: string;
    accept: string;
    maxSize: number; // en MB
    maxFiles?: number;
    helpText?: string;
    instruction?: string;
    onChange: (files: File[]) => void;
    error?: string;
    required?: boolean;
}

export default function FileUpload({
    label,
    name,
    accept,
    maxSize,
    maxFiles = 1,
    helpText,
    instruction,
    onChange,
    error,
    required = false,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const validateFiles = (files: FileList | null): File[] => {
        if (!files) return [];

        const validFiles: File[] = [];
        const maxSizeBytes = maxSize * 1024 * 1024;

        for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
            const file = files[i];

            // Validar tamaño
            if (file.size > maxSizeBytes) {
                alert(`El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`);
                continue;
            }

            // Validar tipo
            const acceptedTypes = accept.split(',').map(t => t.trim());
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            const mimeType = file.type;

            const isValidType = acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileExtension === type.toLowerCase();
                }
                return mimeType.match(new RegExp(type.replace('*', '.*')));
            });

            if (!isValidType) {
                alert(`El archivo ${file.name} no es un formato válido`);
                continue;
            }

            validFiles.push(file);
        }

        return validFiles;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const validFiles = validateFiles(e.dataTransfer.files);
        setSelectedFiles(validFiles);
        onChange(validFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const validFiles = validateFiles(e.target.files);
        setSelectedFiles(validFiles);
        onChange(validFiles);
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onChange(newFiles);
    };

    return (
        <div className={styles.fieldWrapper}>
            <label className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
            </label>

            {instruction && (
                <p className={styles.instruction}>{instruction}</p>
            )}

            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${error ? styles.error : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    name={name}
                    accept={accept}
                    multiple={maxFiles > 1}
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                />

                <div className={styles.uploadIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>

                <p className={styles.dropText}>
                    Arrastra y suelta tus imágenes aquí o{' '}
                    <span className={styles.browseLink}>explora</span>
                </p>

                <p className={styles.formatText}>
                    {accept.replace(/\./g, '').toUpperCase()} - Máx. {maxSize}MB
                </p>
            </div>

            {selectedFiles.length > 0 && (
                <div className={styles.fileList}>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className={styles.fileItem}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className={styles.removeButton}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {helpText && !error && (
                <p className="help-text">{helpText}</p>
            )}

            {error && (
                <p className="error-text">{error}</p>
            )}
        </div>
    );
}
