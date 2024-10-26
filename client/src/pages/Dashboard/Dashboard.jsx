// client/src/pages/Dashboard/Dashboard.jsx
import { useContext } from "react";
import { UserContext } from "../../context/userContext";
import FileUpload from "../../components/FileUpload/FileUpload";
// import './Dashboard.css'

export default function Dashboard() {
    const { user, loading } = useContext(UserContext);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 mt-20">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            {user && (
                <>
                    <h2 className="text-2xl mb-6">Hi, {user.name}!</h2>
                    <FileUpload />
                </>
            )}
        </div>
    );
}