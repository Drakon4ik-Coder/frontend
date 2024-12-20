import React, { useState, useEffect } from "react";

function Pantry() {
  const [foodList, setFoodList] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState({});
  const [selectedFood, setSelectedFood] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [selectedMealRecipe, setSelectedMealRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [adjustedQuantities, setAdjustedQuantities] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, availableResponse, recipesResponse] = await Promise.all([
          fetch('http://localhost:8000/items/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/available-ingredients/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/recipes/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [items, available, recipes] = await Promise.all([
          itemsResponse.json(),
          availableResponse.json(),
          recipesResponse.json()
        ]);

        setFoodList(items);
        setAvailableIngredients(available);
        setRecipes(recipes);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedFood) {
      const selectedItem = foodList.find(item => item.item_id === parseInt(selectedFood));
      if (selectedItem?.is_meal) {
        const mealRecipes = recipes.filter(r => r.meal === selectedItem.item_id);
        setSelectedMealRecipe(mealRecipes);
        setRecipeIngredients(mealRecipes.map(recipe => ({
          ...recipe,
          available: availableIngredients[recipe.ingredient] || 0
        })));
        setAdjustedQuantities(
          mealRecipes.reduce((acc, recipe) => ({
            ...acc,
            [recipe.ingredient]: recipe.quantity
          }), {})
        );
      } else {
        setSelectedMealRecipe(null);
        setRecipeIngredients([]);
      }
    }
  }, [selectedFood, foodList, recipes, availableIngredients]);

  const handleAddToPantry = () => {
    const token = localStorage.getItem('token');
    const food = foodList.find((item) => item.item_id === parseInt(selectedFood));
    
    if (food) {
      fetch("http://localhost:8000/actions/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          item: food.item_id,
          ingredient: food.item_id,
          action_type: "ADD",
          quantity: quantity
        }),
      })
        .then((response) => response.json())
        .then(() => {
          // Update available ingredients
          setAvailableIngredients(prev => ({
            ...prev,
            [food.item_id]: (prev[food.item_id] || 0) + quantity
          }));
        })
        .catch((error) => console.error("Error adding to pantry:", error));
    }
  };

  const handleDisposeFromPantry = () => {
    const token = localStorage.getItem('token');
    const food = foodList.find((item) => item.item_id === parseInt(selectedFood));
    
    if (food && availableIngredients[food.item_id] >= quantity) {
      fetch("http://localhost:8000/actions/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          item: food.item_id,
          ingredient: food.item_id,
          action_type: "DISPOSE",
          quantity: quantity
        }),
      })
        .then((response) => response.json())
        .then(() => {
          // Update available ingredients
          setAvailableIngredients(prev => ({
            ...prev,
            [food.item_id]: prev[food.item_id] - quantity
          }));
        })
        .catch((error) => console.error("Error disposing from pantry:", error));
    }
  };

  const handleCookMeal = async () => {
    const token = localStorage.getItem('token');
    const food = foodList.find((item) => item.item_id === parseInt(selectedFood));
    
    if (food && food.is_meal) {
      try {
        // Create COOK actions for each ingredient
        for (const recipe of recipeIngredients) {
          if (availableIngredients[recipe.ingredient] < adjustedQuantities[recipe.ingredient]) {
            throw new Error(`Insufficient quantity of ${recipe.ingredient.name}`);
          }

          await fetch("http://localhost:8000/actions/", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              item: food.item_id,
              ingredient: recipe.ingredient,
              action_type: "COOK",
              quantity: adjustedQuantities[recipe.ingredient]
            }),
          });
        }

        // Update available ingredients
        setAvailableIngredients(prev => {
          const updated = { ...prev };
          for (const recipe of recipeIngredients) {
            updated[recipe.ingredient] -= adjustedQuantities[recipe.ingredient];
          }
          return updated;
        });

      } catch (error) {
        console.error("Error cooking meal:", error);
        alert(error.message);
      }
    }
  };

  const handleQuantityAdjustment = (ingredientId, newQuantity) => {
    setAdjustedQuantities(prev => ({
      ...prev,
      [ingredientId]: newQuantity
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Pantry</h1>
      
      <div>
        <select
          value={selectedFood}
          onChange={(e) => setSelectedFood(e.target.value)}
        >
          <option value="" disabled>Select Food</option>
          {foodList.map((food) => (
            <option key={food.item_id} value={food.item_id}>
              {food.name} {food.is_meal ? "(Meal)" : ""}
            </option>
          ))}
        </select>

        {selectedMealRecipe ? (
          // Meal cooking interface
          <div>
            <h3>Recipe Ingredients</h3>
            {recipeIngredients.map(recipe => (
              <div key={recipe.ingredient} style={{ margin: '10px 0' }}>
                <span>{foodList.find(f => f.item_id === recipe.ingredient)?.name}</span>
                <input
                  type="number"
                  value={adjustedQuantities[recipe.ingredient]}
                  onChange={(e) => handleQuantityAdjustment(recipe.ingredient, Number(e.target.value))}
                  min="0"
                  max={recipe.available}
                  style={{ marginLeft: '10px' }}
                />
                <span style={{ marginLeft: '10px' }}>
                  Available: {recipe.available}g
                </span>
              </div>
            ))}
            <button 
              onClick={handleCookMeal}
              disabled={recipeIngredients.some(recipe => 
                recipe.available < adjustedQuantities[recipe.ingredient]
              )}
              style={{ marginTop: '10px' }}
            >
              Cook Meal
            </button>
          </div>
        ) : (
          // Regular ingredient interface
          <>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              min="1"
              step="1"
              style={{ marginLeft: "10px" }}
            />
            <button onClick={handleAddToPantry} style={{ marginLeft: "10px" }}>
              Add to Pantry
            </button>
            <button 
              onClick={handleDisposeFromPantry} 
              style={{ marginLeft: "10px" }}
              disabled={!selectedFood || !availableIngredients[selectedFood] || availableIngredients[selectedFood] < quantity}
            >
              Dispose
            </button>
          </>
        )}
      </div>

      <h2>Available Ingredients</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.entries(availableIngredients).map(([itemId, amount]) => {
          const food = foodList.find(f => f.item_id === parseInt(itemId));
          if (!food || amount <= 0) return null;
          
          return (
            <li 
              key={itemId}
              style={{
                padding: '10px',
                margin: '5px 0',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}
            >
              <strong>{food.name}</strong>: {amount}g
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Pantry;