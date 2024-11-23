import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import TranscriptViewer from '../TranscriptViewer/TranscriptViewer';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [currentFile, setCurrentFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [transcriptKey, setTranscriptKey] = useState(0);

    useEffect(() => {
        fetchExistingFile();
    }, []);

    const fetchExistingFile = async () => {
        try {
            const response = await axios.get('/api/file', {
                withCredentials: true
            });
            if (response.data.file) {
                setCurrentFile(response.data.file);
                setShowTranscript(true);
            }
        } catch (error) {
            console.error('Error fetching file:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check file size (limit to 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                e.target.value = null; // Reset file input
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/upload', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('File uploaded successfully');
                setCurrentFile(response.data.file);
                setFile(null);
                setShowTranscript(true);
                setTranscriptKey(prev => prev + 1);
                // Reset file input
                e.target.reset();
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error(error.response?.data?.error || 'Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get('/api/file/download', {
                responseType: 'blob',
                withCredentials: true
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', currentFile.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Error downloading file');
        }
    };

    return (
        <div>
            {currentFile && (
                <div className="current-file">
                    <h4>Current File:</h4>
                    <p>{currentFile.filename}</p>
                    <p>Uploaded on: {new Date(currentFile.uploadDate).toLocaleDateString()}</p>
                    <div className="button-group">
                        <button 
                            onClick={handleDownload}
                            className="dashboard-btn download-btn"
                        >
                            Download File
                        </button>
                        <button 
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="dashboard-btn"
                        >
                            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleUpload} className="upload-form">
                <div className="file-upload-container">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="file-input"
                        accept=".txt,.pdf,.doc,.docx"
                    />
                    <p className="file-instructions">
                        Accepted file types: .txt, .pdf, .doc, .docx (Max size: 5MB)
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={!file || loading}
                    className="dashboard-btn"
                >
                    {loading ? 'Uploading...' : 'Upload File'}
                </button>
            </form>

            {showTranscript && <TranscriptViewer key={transcriptKey} />}
        </div>
    );
};

export default FileUpload;