import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CalorieTracker from "./CalorieTracker";
import FoodListManager from "./FoodListManager";

function App() {
  const [foodList, setFoodList] = useState([]);
  const [eatenFoods, setEatenFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/foods/").then(res => res.json()),
      fetch("http://localhost:8000/eaten-foods/").then(res => res.json())
    ])
      .then(([foods, eaten]) => {
        setFoodList(foods);
        setEatenFoods(eaten);
      })
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Router>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <nav style={{ marginBottom: "20px" }}>
          <Link to="/" style={{ margin: "0 10px" }}>
            Calorie Tracker
          </Link>
          <Link to="/food-list" style={{ margin: "0 10px" }}>
            Manage Food List
          </Link>
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <CalorieTracker
                foodList={foodList}
                eatenFoods={eatenFoods}
                setEatenFoods={setEatenFoods}
              />
            }
          />
          <Route
            path="/food-list"
            element={
              <FoodListManager
                foodList={foodList}
                setFoodList={setFoodList}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
