import { useContext } from "react";
import { UserContext } from "../../context/userContext";
import FileUpload from "../../components/FileUpload/FileUpload";
import './Dashboard.css';
import Navbar from '../../components/Navbar/Navbar'


export default function Dashboard() {
    const { user, loading } = useContext(UserContext);

    if (loading) {
        return (
            <div className="dashboard-container">
                <Navbar/>
                <div className="dashboard-content">
                    <div className="status-message">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Navbar/>
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    {user && <h2>Welcome, {user.name}!</h2>}
                </div>
                
                <div className="file-section">
                    <h3>File Management</h3>
                    <FileUpload />
                </div>
            </div>
        </div>
    );
}