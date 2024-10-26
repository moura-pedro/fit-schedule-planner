import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [currentFile, setCurrentFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchExistingFile();
    }, []);

    const fetchExistingFile = async () => {
        try {
            const response = await axios.get('/api/file');
            if (response.data.file) {
                setCurrentFile(response.data.file);
            }
        } catch (error) {
            console.error('Error fetching file:', error);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
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
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('File uploaded successfully');
                setCurrentFile(response.data.file);
                setFile(null);
                // Reset file input
                e.target.reset();
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get('/api/file/download', {
                responseType: 'blob'
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
                    <button 
                        onClick={handleDownload}
                        className="dashboard-btn download-btn"
                    >
                        Download File
                    </button>
                </div>
            )}

            <form onSubmit={handleUpload}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="file-input"
                />
                <button
                    type="submit"
                    disabled={!file || loading}
                    className="dashboard-btn"
                >
                    {loading ? 'Uploading...' : 'Upload File'}
                </button>
            </form>
        </div>
    );
};

export default FileUpload;