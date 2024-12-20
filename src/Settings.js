import React, { useState, useEffect } from "react";
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({
    goal_calories: 2000,
    goal_protein: 150,
    goal_carbs: 250,
    goal_fats: 45
  });
  // Add new state for temporary values
  const [tempGoals, setTempGoals] = useState({
    goal_calories: 2000,
    goal_protein: 150,
    goal_carbs: 250,
    goal_fats: 45
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('https://Drakon4ik.pythonanywhere.com/user-settings/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
      })
      .then(settings => {
        setGoals(settings);
        setTempGoals(settings); // Also set temporary goals
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching settings:', error);
        setLoading(false);
      });
  }, []);

  const handleUpdateGoals = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://Drakon4ik.pythonanywhere.com/user-settings/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tempGoals)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = await response.json();
      setGoals(updatedSettings);
      alert('Goals updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update goals');
    }
  };

  const handleInputChange = (value, type) => {
    setTempGoals(prev => ({
      ...prev,
      [type]: parseInt(value, 10)
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Nutrition Goals</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="setting-item">
          <label>
            Daily Calorie Goal:
            <input
              type="number"
              value={tempGoals.goal_calories}
              onChange={(e) => handleInputChange(e.target.value, 'goal_calories')}
              style={{
                marginLeft: "10px",
                padding: "5px",
                width: "100px",
              }}
            />
            kcal
          </label>
        </div>

        <div className="setting-item">
          <label>
            Daily Protein Goal:
            <input
              type="number"
              value={tempGoals.goal_protein}
              onChange={(e) => handleInputChange(e.target.value, 'goal_protein')}
              style={{
                marginLeft: "10px",
                padding: "5px",
                width: "100px",
              }}
            />
            g
          </label>
        </div>

        <div className="setting-item">
          <label>
            Daily Carbs Goal:
            <input
              type="number"
              value={tempGoals.goal_carbs}
              onChange={(e) => handleInputChange(e.target.value, 'goal_carbs')}
              style={{
                marginLeft: "10px",
                padding: "5px",
                width: "100px",
              }}
            />
            g
          </label>
        </div>

        <div className="setting-item">
          <label>
            Daily Fats Goal:
            <input
              type="number"
              value={tempGoals.goal_fats}
              onChange={(e) => handleInputChange(e.target.value, 'goal_fats')}
              style={{
                marginLeft: "10px",
                padding: "5px",
                width: "100px",
              }}
            />
            g
          </label>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleUpdateGoals}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Update Goals
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;