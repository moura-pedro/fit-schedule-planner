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
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">File Management</h2>
            
            {currentFile ? (
                <div className="mb-4 p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold">Current File:</h3>
                    <p className="mb-2">{currentFile.filename}</p>
                    <p className="text-sm text-gray-600">
                        Uploaded on: {new Date(currentFile.uploadDate).toLocaleDateString()}
                    </p>
                    <button
                        onClick={handleDownload}
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Download File
                    </button>
                </div>
            ) : (
                <p className="mb-4 text-gray-600">No file uploaded yet.</p>
            )}

            <form onSubmit={handleUpload}>
                <div className="mb-4">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!file || loading}
                    className={`bg-blue-500 text-white px-4 py-2 rounded
                        ${(!file || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                >
                    {loading ? 'Uploading...' : 'Upload File'}
                </button>
            </form>
        </div>
    );
};

export default FileUpload;