import {useState} from "react";

function FoodListManager({ foodList, setFoodList }) {
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const handleAddFood = (e) => {
    e.preventDefault();
    fetch("http://localhost:8000/foods/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: foodName, 
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fats: Number(fats)
      }),
    })
      .then((response) => response.json())
      .then((newFood) => setFoodList((prevList) => [...prevList, newFood]))
      .catch((error) => console.error("Error adding food:", error));

    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
  };

  const handleDeleteFood = (foodId) => {
    if (window.confirm('Are you sure? This will also remove all eaten food entries containing this item.')) {
      fetch(`http://localhost:8000/foods/${foodId}/`, {
        method: 'DELETE',
      })
        .then(response => {
          if (response.ok) {
            setFoodList(prevList => prevList.filter(food => food.id !== foodId));
          } else {
            throw new Error('Failed to delete food');
          }
        })
        .catch(error => {
          console.error('Error deleting food:', error);
          alert('Failed to delete food');
        });
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
          <label>Calories per 100g:
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>Protein (g):
            <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>Carbs (g):
            <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>Fats (g):
            <input type="number" value={fats} onChange={(e) => setFats(e.target.value)} required />
          </label>
        </div>
        <button type="submit">Add Food</button>
      </form>

      <h2>Food List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {foodList.map((food) => (
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
              {food.name} - {food.calories}kcal | P:{food.protein}g C:{food.carbs}g F:{food.fats}g
            </div>
            <button
              onClick={() => handleDeleteFood(food.id)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#FF6347',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FoodListManager;
