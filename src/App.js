import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CalorieTracker from "./CalorieTracker";
import FoodListManager from "./FoodListManager";
import { AuthProvider } from "./AuthContext";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ProtectedRoute } from "./components/ProtectedRoute"; 

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
    <AuthProvider>
      <Router>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <nav style={{ marginBottom: "20px" }}>
            <Link to="/" style={{ margin: "0 10px" }}>Calorie Tracker</Link>
            <Link to="/food-list" style={{ margin: "0 10px" }}>Manage Food List</Link>
            <Link to="/login" style={{ margin: "0 10px" }}>Login</Link>
            <Link to="/register" style={{ margin: "0 10px" }}>Register</Link>
          </nav>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <CalorieTracker 
                  foodList={foodList}
                  eatenFoods={eatenFoods}
                  setEatenFoods={setEatenFoods}
                />
              </ProtectedRoute>
            } />
            <Route path="/food-list" element={
              <ProtectedRoute>
                <FoodListManager
                  foodList={foodList}
                  setFoodList={setFoodList}
                />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
