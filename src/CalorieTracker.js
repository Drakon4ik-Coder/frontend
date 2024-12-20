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

  // Simplify input handler to just update state
  const handleWeightChange = (e) => {
    setWeight(parseInt(e.target.value, 10));
    setWeightError(''); // Clear any previous error
  };

  // Fetch food items, actions, and user settings
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, eatenResponse, settingsResponse] = await Promise.all([
          fetch('http://localhost:8000/items/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/eaten-food/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/user-settings/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        if (!itemsResponse.ok || !eatenResponse.ok || !settingsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [items, eatenData, userSettings] = await Promise.all([
          itemsResponse.json(),
          eatenResponse.json(),
          settingsResponse.json()
        ]);
        console.log(userSettings);

        setFoodList(items);
        setGoal(userSettings);

        // Safely handle eatenData
        const processedEatenFoods = [];
        if (eatenData && typeof eatenData === 'object') {
          Object.entries(eatenData).forEach(([itemId, quantities]) => {
            const item = items.find(item => item.item_id === parseInt(itemId));
            if (item && quantities) {
              processedEatenFoods.push({
                item,
                quantities: Array.isArray(quantities) ? quantities : [quantities]
              });
            }
          });
        }
        setEatenFoods(processedEatenFoods);

      } catch (err) {
        console.error('Error fetching data:', err);
        setEatenFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        if (!entry?.item || !Array.isArray(entry?.quantities)) {
          return sum;
        }
        
        const totalQuantity = entry.quantities.reduce((a, b) => a + (Number(b) || 0), 0);
        const itemMacros = calculateItemMacros(entry.item, totalQuantity);
        
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
      const token = localStorage.getItem('token');
      fetch("http://localhost:8000/actions/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          item: food.item_id,
          ingredient: food.item_id,
          action_type: "EAT",
          quantity: weight
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to add food');
          }
          return response.json();
        })
        .then((newAction) => {
          // Update eatenFoods with the new action
          setEatenFoods(prev => {
            const existingEntry = prev.find(entry => entry.item.item_id === food.item_id);
            
            if (existingEntry) {
              // Add quantity to existing entry
              return prev.map(entry => 
                entry.item.item_id === food.item_id 
                  ? { 
                      ...entry, 
                      quantities: [...entry.quantities, weight]
                    }
                  : entry
              );
            } else {
              // Create new entry
              return [...prev, {
                item: food,
                quantities: [weight]
              }];
            }
          });
          setWeightError('');
          // Reset selection and weight after successful addition
          setSelectedFood("");
          setWeight(100);
        })
        .catch((error) => {
          console.error("Error adding eaten food:", error);
          alert("Failed to add food");
        });
    }
  };

  // Remove food from eaten list
  const handleRemoveFood = (id) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/actions/${id}/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to remove food');
        }
        setEatenFoods((prev) => prev.filter((item) => item.action_id !== id));
      })
      .catch((error) => {
        console.error("Error removing eaten food:", error);
        alert("Failed to remove food");
      });
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

  // Initialize with empty array if undefined
  const safeEatenFoods = Array.isArray(eatenFoods) ? eatenFoods : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <h1>Calorie Tracker</h1>

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
              {foodList.map((food) => (
                <option key={food.item_id} value={food.item_id}>
                  {food.name}
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

          {/* Added Foods List */}
          <h2>Consumed Foods</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {safeEatenFoods.map((entry) => {
              if (!entry?.item || !Array.isArray(entry?.quantities)) return null;
              const totalQuantity = entry.quantities.reduce((a, b) => a + b, 0);
              const itemMacros = calculateItemMacros(entry.item, totalQuantity);
              
              return (
                <li 
                  key={entry.item.item_id}
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
                    <strong>{entry.item.name}</strong> - {totalQuantity}g
                    <br />
                    <small>
                      {Math.round(itemMacros.calories)} kcal |
                      P: {Math.round(itemMacros.protein)}g |
                      C: {Math.round(itemMacros.carbs)}g |
                      F: {Math.round(itemMacros.fats)}g
                    </small>
                  </div>
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
