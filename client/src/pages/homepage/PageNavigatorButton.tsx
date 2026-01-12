import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNavigatorButton = () => {
  const navigate = useNavigate();

  const handleNextPage = () => {
    navigate('/next-page'); // Replace with your next page route
  };

  const handlePreviousPage = () => {
    navigate('/previous-page'); // Replace with your previous page route
  };

  return (
    <div className="page-navigator">
      <button
        className="nav-button left"
        onClick={handlePreviousPage}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 32px',
          textAlign: 'center',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '16px',
          margin: '4px 2px',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        &#8592;
      </button>

      <button
        className="nav-button right"
        onClick={handleNextPage}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 32px',
          textAlign: 'center',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '16px',
          margin: '4px 2px',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        &#8594;
      </button>
    </div>
  );
};

export default PageNavigatorButton;
