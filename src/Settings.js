
import React, { useState, useEffect } from "react";

function Settings() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({
    goal_calories: 2000,
    goal_protein: 150,
    goal_carbs: 250,
    goal_fats: 45
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:8000/user-settings/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
      })
      .then(settings => {
        setGoals(settings);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching settings:', error);
        setLoading(false);
      });
  }, []);

  const handleUpdateGoal = async (newValue, type) => {
    const token = localStorage.getItem('token');
    const updatedGoals = { ...goals, [type]: newValue };

    try {
      const response = await fetch('http://localhost:8000/user-settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedGoals)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = await response.json();
      setGoals(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update goals');
    }
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
              value={goals.goal_calories}
              onChange={(e) => handleUpdateGoal(parseInt(e.target.value, 10), 'goal_calories')}
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
              value={goals.goal_protein}
              onChange={(e) => handleUpdateGoal(parseFloat(e.target.value), 'goal_protein')}
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
              value={goals.goal_carbs}
              onChange={(e) => handleUpdateGoal(parseFloat(e.target.value), 'goal_carbs')}
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
              value={goals.goal_fats}
              onChange={(e) => handleUpdateGoal(parseFloat(e.target.value), 'goal_fats')}
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
    </div>
  );
}

export default Settings;