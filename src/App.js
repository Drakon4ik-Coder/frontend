import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CalorieTracker from "./CalorieTracker";
import FoodListManager from "./FoodListManager";
import { AuthProvider, useAuth } from "./AuthContext";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Pantry from "./Pantry";
import Settings from "./Settings";

function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <nav style={{ marginBottom: "20px" }}>
      {isAuthenticated ? (
        <>
          <Link to="/" style={{ margin: "0 10px" }}>Calorie Tracker</Link>
          <Link to="/food-list" style={{ margin: "0 10px" }}>Manage Food List</Link>
          <Link to="/pantry" style={{ margin: "0 10px" }}>Pantry</Link>
          <Link to="/settings" style={{ margin: "0 10px" }}>Settings</Link>
        </>
      ) : (
        <>
          <Link to="/login" style={{ margin: "0 10px" }}>Login</Link>
          <Link to="/register" style={{ margin: "0 10px" }}>Register</Link>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <CalorieTracker />
              </ProtectedRoute>
            } />
            <Route path="/food-list" element={
              <ProtectedRoute>
                <FoodListManager />
              </ProtectedRoute>
            } />
            <Route path="/pantry" element={
              <ProtectedRoute>
                <Pantry />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
