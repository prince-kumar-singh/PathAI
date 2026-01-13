import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BigFiveResult from "../components/BigFiveResult";

const BigFiveResultsPage: React.FC = () => {
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

    return <BigFiveResult scores={scores} />;
};

export default BigFiveResultsPage;
