import React, { useState, useEffect } from "react";
import { use } from "react";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function CalorieTracker() {
  const [foodList, setFoodList] = useState([]);
  const [eatenFoods, setEatenFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState("");  // This will now store item_id
  const [weight, setWeight] = useState(100);
  const [macros, setMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });
  const [goal, setGoal] = useState({
    goal_calories: 2000,
    goal_protein: 150,
    goal_carbs: 250,
    goal_fats: 45
  });

  // Add state for input validation
  const [weightError, setWeightError] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allEatenFoods, setAllEatenFoods] = useState([]);

  // Simplify input handler to just update state
  const handleWeightChange = (e) => {
    setWeight(parseInt(e.target.value, 10));
    setWeightError(''); // Clear any previous error
  };

  // Helper function to format date for API
  const formatDateForAPI = (date) => {
    return date.split('T')[0];
  };

  // Helper function to check if date matches selected date
  const isMatchingDate = (timestamp) => {
    const date = new Date(timestamp);
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };

  // Fetch food items, actions, and user settings
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, eatenResponse, settingsResponse, availableResponse] = await Promise.all([
          fetch('https://Drakon4ik.pythonanywhere.com/items/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('https://Drakon4ik.pythonanywhere.com/eaten-food/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('https://Drakon4ik.pythonanywhere.com/user-settings/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('https://Drakon4ik.pythonanywhere.com/available-ingredients/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [items, eatenData, userSettings, available] = await Promise.all([
          itemsResponse.json(),
          eatenResponse.json(),
          settingsResponse.json(),
          availableResponse.json()
        ]);

        setFoodList(items);
        setGoal(userSettings);
        setAvailableIngredients(available);
        setAllEatenFoods(eatenData);
        
        // Process and set eaten foods for selected date
        const processedFoods = processEatenFoods(eatenData);
        setEatenFoods(processedFoods);
      } catch (err) {
        console.error('Error fetching data:', err);
        setEatenFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add useEffect to handle date changes
  useEffect(() => {
    if (allEatenFoods.length > 0) {
      const processedFoods = processEatenFoods(allEatenFoods);
      setEatenFoods(processedFoods);
    }
  }, [selectedDate, allEatenFoods]);

  const calculateItemMacros = (item, quantity) => {
    const ratio = quantity / item.serving_weight;
    return {
      calories: item.calories * ratio,
      protein: item.protein * ratio,
      carbs: (item.carbs_sugar + item.carbs_fiber + item.carbs_starch) * ratio,
      fats: (item.fats_saturated + item.fats_unsaturated) * ratio
    };
  };

  // Calculate total macros from eaten foods
  useEffect(() => {
    if (!Array.isArray(eatenFoods) || eatenFoods.length === 0) {
      setMacros({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      return;
    }

    try {
      const totals = eatenFoods.reduce((sum, entry) => {
        if (!entry?.item) return sum;
        
        const itemMacros = calculateItemMacros(entry.item, entry.quantity);
        
        return {
          calories: sum.calories + (itemMacros.calories || 0),
          protein: sum.protein + (itemMacros.protein || 0),
          carbs: sum.carbs + (itemMacros.carbs || 0),
          fats: sum.fats + (itemMacros.fats || 0)
        };
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

      setMacros(totals);
    } catch (error) {
      console.error('Error calculating macros:', error);
      setMacros({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    }
  }, [eatenFoods, foodList]);

  // Add food with macros
  const handleAddFood = () => {
    if (isNaN(weight) || weight <= 0) {
      setWeightError('Weight must be a positive number');
      return;
    }

    const food = foodList.find((item) => item.item_id === parseInt(selectedFood));
    if (food) {
      const availableAmount = availableIngredients[food.item_id] || 0;
      if (availableAmount < weight) {
        alert(`Not enough ${food.name} available. You only have ${availableAmount}g.`);
        return;
      }

      const token = localStorage.getItem('token');
      fetch("https://Drakon4ik.pythonanywhere.com/actions/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          item: food.item_id,
          ingredient: food.item_id,
          action_type: "EAT",
          quantity: weight,
          timestamp: selectedDate
        }),
      })
        .then(response => {
          response.json()
        })
        .then(newAction => {
          // Add new eaten food to state
          setAllEatenFoods(prev => [...prev, {
            item_id: food.item_id,
            quantity: weight,
            timestamp: new Date().toISOString()
          }]);
          
          // Update available ingredients
          setAvailableIngredients(prev => ({
            ...prev,
            [food.item_id]: prev[food.item_id] - weight
          }));

          setWeightError('');
          setSelectedFood("");
          setWeight(100);
        })
        .catch(error => {
          console.error("Error adding eaten food:", error);
          alert("Failed to add food");
        });
    }
  };

  // Modified handleRemoveFood to work with new API format
  const handleRemoveFood = async (actionId, itemId, quantity) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://Drakon4ik.pythonanywhere.com/actions/${actionId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove food');
      }

      // Update both states
      setAllEatenFoods(prev => prev.filter(food => food.action_id !== actionId));
      setAvailableIngredients(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + quantity
      }));
    } catch (error) {
      console.error("Error removing eaten food:", error);
      alert("Failed to remove food");
    }
  };

  // First create styles object for reusability
  const progressBarContainerStyle = {
    width: '80%',
    margin: '20px auto',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px'
  };

  const progressBarStyle = (percentage, color) => ({
    width: '100%',
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative'
  });

  const progressStyle = (percentage, color) => ({
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: color,
    transition: 'width 0.3s ease'
  });

  const progressLabelStyle = {
    marginBottom: '5px',
    display: 'flex',
    justifyContent: 'space-between'
  };

  // Add date navigation functions
  const changeDate = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Initialize with empty array if undefined
  const safeEatenFoods = Array.isArray(eatenFoods) ? eatenFoods : [];

  // Modified function to process eaten foods
  const processEatenFoods = (eatenData) => {
    return eatenData
      .filter(entry => isMatchingDate(entry.timestamp))
      .map(entry => ({
        action_id: entry.action_id,
        item: foodList.find(item => item.item_id === entry.item_id),
        quantity: entry.quantity,
        timestamp: entry.timestamp
      }))
      .filter(entry => entry.item); // Filter out any entries where item wasn't found
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Date Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px',
            marginBottom: '20px' 
          }}>
            <button onClick={() => changeDate(-1)}>&larr; Previous Day</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <button 
              onClick={() => changeDate(1)}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            >
              Next Day &rarr;
            </button>
          </div>

          <h1>Calorie Tracker - {new Date(selectedDate).toLocaleDateString()}</h1>

          {/* Calorie Circle */}
          <div style={{ width: "200px", margin: '0 auto' }}>
            <CircularProgressbar
              value={(macros.calories / goal.goal_calories) * 100}
              text={`${Math.round(macros.calories)}/${goal.goal_calories}`}
              styles={buildStyles({
                pathColor: "#4CAF50",
                textColor: "#4CAF50",
                trailColor: "#d6d6d6",
                textSize: "16px",
              })}
            />
          </div>

          {/* Macro Progress Bars */}
          <div style={progressBarContainerStyle}>
            {/* Protein */}
            <div style={{ flex: 1 }}>
              <div style={progressLabelStyle}>
                <span>Protein</span>
                <span>{Math.round(macros.protein)}g / {goal.goal_protein}g</span>
              </div>
              <div style={progressBarStyle()}>
                <div style={progressStyle((macros.protein / goal.goal_protein) * 100, '#FF6B6B')} />
              </div>
            </div>

            {/* Carbs */}
            <div style={{ flex: 1 }}>
              <div style={progressLabelStyle}>
                <span>Carbs</span>
                <span>{Math.round(macros.carbs)}g / {goal.goal_carbs}g</span>
              </div>
              <div style={progressBarStyle()}>
                <div style={progressStyle((macros.carbs / goal.goal_carbs) * 100, '#4ECDC4')} />
              </div>
            </div>

            {/* Fats */}
            <div style={{ flex: 1 }}>
              <div style={progressLabelStyle}>
                <span>Fats</span>
                <span>{Math.round(macros.fats)}g / {goal.goal_fats}g</span>
              </div>
              <div style={progressBarStyle()}>
                <div style={progressStyle((macros.fats / goal.goal_fats) * 100, '#FFD93D')} />
              </div>
            </div>
          </div>

          {/* Food Selector */}
          <div>
            <h2>Add Food</h2>
            <select
              value={selectedFood}
              onChange={(e) => setSelectedFood(e.target.value)}
            >
              <option value="" disabled>
                Select Food
              </option>
              {foodList
                .filter(food => (availableIngredients[food.item_id] || 0) > 0)
                .map((food) => (
                  <option key={food.item_id} value={food.item_id}>
                    {food.name} ({availableIngredients[food.item_id]}g available)
                  </option>
                ))}
            </select>
            <div>
              <input
                type="number"
                value={weight}
                onChange={handleWeightChange}
                min="1"
                step="1"
                placeholder="Weight (g)"
                style={{
                  marginLeft: "10px",
                  width: "100px",
                  borderColor: weightError ? '#ff0000' : 'initial'
                }}
              />
              {weightError && (
                <div style={{ color: '#ff0000', fontSize: '12px', marginTop: '4px' }}>
                  {weightError}
                </div>
              )}
            </div>
            <button onClick={handleAddFood} style={{ marginLeft: "10px" }}>
              Add Food
            </button>
          </div>

          {/* Modified Consumed Foods List */}
          <h2>Consumed Foods</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {safeEatenFoods.map((entry) => {
              if (!entry?.item) return null;
              const itemMacros = calculateItemMacros(entry.item, entry.quantity);
              
              return (
                <li 
                  key={entry.action_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    margin: '5px 0',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}
                >
                  <div>
                    <strong>{entry.item.name}</strong> - {entry.quantity}g
                    <br />
                    <small>
                      {Math.round(itemMacros.calories)} kcal |
                      P: {Math.round(itemMacros.protein)}g |
                      C: {Math.round(itemMacros.carbs)}g |
                      F: {Math.round(itemMacros.fats)}g
                    </small>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFood(entry.action_id, entry.item.item_id, entry.quantity)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default CalorieTracker;
