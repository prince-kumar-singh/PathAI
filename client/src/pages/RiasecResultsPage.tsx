import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RiasecResult from "../components/RiascResult";

const RiasecResultsPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const scores = location.state?.scores;

    // If no scores in state, redirect to dashboard
    if (!scores || Object.keys(scores).length === 0) {
        React.useEffect(() => {
            navigate("/dashboard");
        }, [navigate]);
        return null;
    }

    // Extract holland_code if present
    const { holland_code, ...scoreValues } = scores;

    return <RiasecResult scores={scoreValues} hollandCode={holland_code} />;
};

export default RiasecResultsPage;
