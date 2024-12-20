import {useState, useEffect} from "react";

function FoodListManager() {
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [servingWeight, setServingWeight] = useState("");
  const [isMeal, setIsMeal] = useState(false);
  const [protein, setProtein] = useState("");
  const [fatsSaturated, setFatsSaturated] = useState("");
  const [fatsUnsaturated, setFatsUnsaturated] = useState("");
  const [carbsSugar, setCarbsSugar] = useState("");
  const [carbsFiber, setCarbsFiber] = useState("");
  const [carbsStarch, setCarbsStarch] = useState("");
  const [foodList, setFoodList] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("g");
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch("https://Drakon4ik.pythonanywhere.com/items/", {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch("https://Drakon4ik.pythonanywhere.com/recipes/", {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])
      .then(([itemsRes, recipesRes]) => Promise.all([itemsRes.json(), recipesRes.json()]))
      .then(([items, recipes]) => {
        setFoodList(items);
        setRecipes(recipes);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const calculateMealNutrition = (ingredients) => {
    return ingredients.reduce((total, ing) => {
      const ingredient = foodList.find(f => f.item_id === ing.ingredientId);
      const ratio = ing.quantity / ingredient.serving_weight;
      return {
        calories: total.calories + ingredient.calories * ratio,
        protein: total.protein + ingredient.protein * ratio,
        fats_saturated: total.fats_saturated + ingredient.fats_saturated * ratio,
        fats_unsaturated: total.fats_unsaturated + ingredient.fats_unsaturated * ratio,
        carbs_sugar: total.carbs_sugar + ingredient.carbs_sugar * ratio,
        carbs_fiber: total.carbs_fiber + ingredient.carbs_fiber * ratio,
        carbs_starch: total.carbs_starch + ingredient.carbs_starch * ratio,
      };
    }, {
      calories: 0,
      protein: 0,
      fats_saturated: 0,
      fats_unsaturated: 0,
      carbs_sugar: 0,
      carbs_fiber: 0,
      carbs_starch: 0,
    });
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (isMeal && ingredients.length > 0) {
        // Create meal
        const mealResponse = await fetch("https://Drakon4ik.pythonanywhere.com/items/", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            name: foodName,
            is_meal: true,
            serving_weight: ingredients.reduce((sum, ing) => sum + ing.quantity, 0),
            calories: 0,
            protein: 0,
            fats_saturated: 0,
            fats_unsaturated: 0,
            carbs_sugar: 0,
            carbs_fiber: 0,
            carbs_starch: 0
          }),
        });

        const newMeal = await mealResponse.json();

        // Create recipes for ingredients
        for (const ingredient of ingredients) {
          await fetch("https://Drakon4ik.pythonanywhere.com/recipes/", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              meal: newMeal.item_id,
              ingredient: ingredient.ingredientId,
              quantity: ingredient.quantity
            }),
          });
        }

        setFoodList(prev => [...prev, newMeal]);
      } else {
        // Create regular food item
        const itemResponse = await fetch("https://Drakon4ik.pythonanywhere.com/items/", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            name: foodName,
            is_meal: false,
            calories: Number(calories),
            serving_weight: Number(servingWeight),
            protein: Number(protein),
            fats_saturated: Number(fatsSaturated),
            fats_unsaturated: Number(fatsUnsaturated),
            carbs_sugar: Number(carbsSugar),
            carbs_fiber: Number(carbsFiber),
            carbs_starch: Number(carbsStarch)
          }),
        });

        const newItem = await itemResponse.json();
        setFoodList(prev => [...prev, newItem]);
      }

      // Reset form
      setFoodName("");
      setCalories("");
      setServingWeight("");
      setProtein("");
      setFatsSaturated("");
      setFatsUnsaturated("");
      setCarbsSugar("");
      setCarbsFiber("");
      setCarbsStarch("");
      setIsMeal(false);
      setIngredients([]);
    } catch (error) {
      console.error("Error adding food:", error);
    }
  };

  const handleAddIngredient = () => {
    if (selectedIngredient && ingredientQuantity) {
      const ingredient = foodList.find(f => f.item_id === parseInt(selectedIngredient));
      setIngredients(prev => [...prev, {
        ingredientId: ingredient.item_id,
        name: ingredient.name,
        quantity: parseFloat(ingredientQuantity),
        unit: ingredientUnit
      }]);
      setSelectedIngredient("");
      setIngredientQuantity("");
    }
  };

  return (
    <div>
      <h1>Manage Food List</h1>
      <form onSubmit={handleAddFood}>
        <div>
          <label>Food Name:
            <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>Is Meal:
            <input type="checkbox" checked={isMeal} onChange={(e) => setIsMeal(e.target.checked)} />
          </label>
        </div>

        {!isMeal && (
          <>
            <div>
              <label>Calories:
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Serving Weight (g):
                <input type="number" value={servingWeight} onChange={(e) => setServingWeight(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Protein (g):
                <input type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Saturated Fats (g):
                <input type="number" step="0.1" value={fatsSaturated} onChange={(e) => setFatsSaturated(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Unsaturated Fats (g):
                <input type="number" step="0.1" value={fatsUnsaturated} onChange={(e) => setFatsUnsaturated(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Sugar (g):
                <input type="number" step="0.1" value={carbsSugar} onChange={(e) => setCarbsSugar(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Fiber (g):
                <input type="number" step="0.1" value={carbsFiber} onChange={(e) => setCarbsFiber(e.target.value)} required />
              </label>
            </div>
            <div>
              <label>Starch (g):
                <input type="number" step="0.1" value={carbsStarch} onChange={(e) => setCarbsStarch(e.target.value)} required />
              </label>
            </div>
          </>
        )}

        {isMeal && (
          <div>
            <h3>Add Ingredients</h3>
            <div>
              <select value={selectedIngredient} onChange={(e) => setSelectedIngredient(e.target.value)}>
                <option value="">Select Ingredient</option>
                {foodList.filter(f => !f.is_meal).map((food) => (
                  <option key={food.item_id} value={food.item_id}>{food.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={ingredientQuantity}
                onChange={(e) => setIngredientQuantity(e.target.value)}
                placeholder="Quantity"
              />
              <input
                type="text"
                value={ingredientUnit}
                onChange={(e) => setIngredientUnit(e.target.value)}
                placeholder="Unit"
              />
              <button type="button" onClick={handleAddIngredient}>Add Ingredient</button>
            </div>
            
            <ul>
              {ingredients.map((ing, index) => (
                <li key={index}>
                  {ing.name} - {ing.quantity}{ing.unit}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit">Add Food</button>
      </form>

      <h2>Food List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {foodList.map((food) => (
          <li 
            key={food.item_id}
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}
          >
            <div><strong>{food.name}</strong> {food.is_meal ? "(Meal)" : ""}</div>
            <div>Calories: {food.calories} | Serving: {food.serving_weight}g</div>
            <div>
              Protein: {food.protein}g | 
              Fats (S/U): {food.fats_saturated}g/{food.fats_unsaturated}g | 
              Carbs (Sugar/Fiber/Starch): {food.carbs_sugar}g/{food.carbs_fiber}g/{food.carbs_starch}g
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FoodListManager;
