import React, { useState, useEffect } from "react";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function CalorieTracker({ foodList, eatenFoods, setEatenFoods }) {
  const [selectedFood, setSelectedFood] = useState("");
  const [weight, setWeight] = useState(100);
  const [macros, setMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });
  const [goal, setGoal] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65
  });

  // Add state for input validation
  const [weightError, setWeightError] = useState('');

  // Simplify input handler to just update state
  const handleWeightChange = (e) => {
    setWeight(parseInt(e.target.value, 10));
    setWeightError(''); // Clear any previous error
  };

  // Calculate total macros from eaten foods
  useEffect(() => {
    if (!Array.isArray(eatenFoods)) {
      console.error('eatenFoods is not an array:', eatenFoods);
      setMacros({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      return;
    }

    const totals = eatenFoods.reduce((sum, food) => {
      const foodItem = foodList.find(f => f.id === food.food);
      if (!foodItem) {
        console.warn('Food item not found:', food);
        return sum;
      }
      return {
        calories: sum.calories + (foodItem.calories * food.weight) / 100,
        protein: sum.protein + (foodItem.protein * food.weight) / 100,
        carbs: sum.carbs + (foodItem.carbs * food.weight) / 100,
        fats: sum.fats + (foodItem.fats * food.weight) / 100
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    setMacros(totals);
  }, [eatenFoods, foodList]);

  // Add food with macros
  const handleAddFood = () => {
    // Validate weight first
    if (isNaN(weight) || weight <= 0) {
      setWeightError('Weight must be a positive number');
      return;
    }

    const food = foodList.find((item) => item.name === selectedFood);
    if (food) {
      const token = localStorage.getItem('token');
      for (var i = 0; i < localStorage.length; i++){
        console.log(localStorage.getItem(localStorage.key(i)));
      }
      fetch("http://localhost:8000/eaten-foods/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ food: food.id, weight }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to add food');
          }
          return response.json();
        })
        .then((newEatenFood) => {
          setEatenFoods(prev => {
            const prevArray = Array.isArray(prev) ? prev : [];
            return [...prevArray, newEatenFood];
          });
          setWeightError('');
        })
        .catch((error) => console.error("Error adding eaten food:", error));
    }
  };

  // Remove food from eaten list
  const handleRemoveFood = (id) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/eaten-foods/${id}/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to remove food');
        }
        setEatenFoods((prev) => prev.filter((item) => item.id !== id));
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
      <h1>Calorie Tracker</h1>

      {/* Calorie Circle */}
      <div style={{ width: "200px", margin: '0 auto' }}>
        <CircularProgressbar
          value={(macros.calories / goal.calories) * 100}
          text={`${Math.round(macros.calories)}/${goal.calories}`}
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
            <span>{Math.round(macros.protein)}g / {goal.protein}g</span>
          </div>
          <div style={progressBarStyle()}>
            <div style={progressStyle((macros.protein / goal.protein) * 100, '#FF6B6B')} />
          </div>
        </div>

        {/* Carbs */}
        <div style={{ flex: 1 }}>
          <div style={progressLabelStyle}>
            <span>Carbs</span>
            <span>{Math.round(macros.carbs)}g / {goal.carbs}g</span>
          </div>
          <div style={progressBarStyle()}>
            <div style={progressStyle((macros.carbs / goal.carbs) * 100, '#4ECDC4')} />
          </div>
        </div>

        {/* Fats */}
        <div style={{ flex: 1 }}>
          <div style={progressLabelStyle}>
            <span>Fats</span>
            <span>{Math.round(macros.fats)}g / {goal.fats}g</span>
          </div>
          <div style={progressBarStyle()}>
            <div style={progressStyle((macros.fats / goal.fats) * 100, '#FFD93D')} />
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
          {foodList.map((food, index) => (
            <option key={index} value={food.name}>
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
        {safeEatenFoods.map((food) => {
        const foodItem = foodList.find(f => f.id === food.food);
        console.log(foodItem);
        return (
          <li 
            key={food.id}
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
              <strong>{food.food_name}</strong> - {food.weight}g
              <br />
              <small>
                {Math.round((foodItem.calories * food.weight) / 100)} kcal |
                P: {Math.round((foodItem.protein * food.weight) / 100)}g |
                C: {Math.round((foodItem.carbs * food.weight) / 100)}g |
                F: {Math.round((foodItem.fats * food.weight) / 100)}g
              </small>
            </div>
            <button
              onClick={() => handleRemoveFood(food.id)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#FF6347',
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

      {/* Set Calorie Goal */}
      <div style={{ marginTop: "20px" }}>
        <label>
          Set Calorie Goal:
          <input
            type="number"
            value={goal.calories}
            onChange={(e) => setGoal({ ...goal, calories: parseInt(e.target.value, 10) || 2000 })}
            style={{
              marginLeft: "10px",
              padding: "5px",
              width: "100px",
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default CalorieTracker;
