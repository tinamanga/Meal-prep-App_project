const API_KEY = '5f8c564bd76247ccb658e942b18f527e';  // Actual API key
const API_URL = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=10`;  

const recipesList = document.getElementById('recipes-list');
const mealPlanList = document.getElementById('meal-plan');
const shoppingList = document.getElementById('shopping-list');
const searchInput = document.getElementById('search-input'); // Search input field
const loadingIndicator = document.getElementById('loading'); // Loading indicator

// Function to display the loading state
function showLoading() {
    loadingIndicator.style.display = 'block';
}
//tebic32027@infornma.com/

// Function to hide the loading state
function hideLoading() {
    loadingIndicator.style.display = 'none';
}

// Fetch recipes from Spoonacular API (GET)
async function fetchRecipes(query = '') {
    showLoading();
    const url = query ? `${API_URL}&query=${query}` : API_URL;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayRecipes(data.results);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        alert('Failed to load recipes. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Display recipes in the DOM
function displayRecipes(recipes) {
    recipesList.innerHTML = '';
    recipes.forEach(recipe => {
        const recipeElement = document.createElement('div');
        recipeElement.classList.add('recipe-item');
        recipeElement.innerHTML = `
            <h3>${recipe.title}</h3>
            <button class="view-recipe" data-id="${recipe.id}">View Details</button>
            <button class="add-to-plan" data-id="${recipe.id}">Add to Meal Plan</button>
        `;
        recipesList.appendChild(recipeElement);

        // Add event listener to view details
        recipeElement.querySelector('.view-recipe').addEventListener('click', () => viewRecipeDetails(recipe.id));
        
        // Add event listener to add to meal plan
        recipeElement.querySelector('.add-to-plan').addEventListener('click', () => addRecipeToPlan(recipe));
    });
}

// View detailed recipe (ingredients and instructions)
async function viewRecipeDetails(recipeId) {
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayRecipeModal(data);
    } catch (error) {
        console.error('Error fetching recipe details:', error);
    }
}

// Display the modal with recipe details
function displayRecipeModal(recipe) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${recipe.title}</h2>
            <h3>Ingredients:</h3>
            <ul>
                ${recipe.extendedIngredients.map(ingredient => `<li>${ingredient.original}</li>`).join('')}
            </ul>
            <h3>Instructions:</h3>
            <p>${recipe.instructions}</p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.close').addEventListener('click', () => modal.remove());

    // Close modal if clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Add recipe to weekly meal plan (POST)
async function addRecipeToPlan(recipe) {
    const mealPlanItem = document.createElement('li');
    mealPlanItem.textContent = recipe.title;
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', async () => {
        await deleteMealPlanItem(recipe);  // Simulate DELETE operation
        mealPlanItem.remove();
    });

    mealPlanItem.appendChild(removeButton);
    mealPlanList.appendChild(mealPlanItem);
    updateShoppingList(recipe);
    
    // POST new meal plan item to a backend (you could set up an API endpoint for this)
    try {
        await fetch('https://your-backend.com/api/meal-plan', {
            method: 'POST',
            mode: 'no-cors',  // This disables the CORS check
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        });
    } catch (error) {
        console.error('Error adding to meal plan:', error);
    }
}

// Generate shopping list based on the meal plan
function updateShoppingList(recipe) {
    const shoppingItem = document.createElement('li');
    shoppingItem.textContent = `${recipe.title}: ${recipe.extendedIngredients ? recipe.extendedIngredients.map(ingredient => ingredient.original).join(', ') : 'No ingredients available'}`;
    shoppingList.appendChild(shoppingItem);
}

// DELETE meal plan item (this is a simulated DELETE request)
async function deleteMealPlanItem(recipe) {
    try {
        await fetch(`https://your-backend.com/api/meal-plan/${recipe.id}`, {
            method: 'DELETE',
        });
        console.log('Item deleted successfully');
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

// Toggle sections (view recipes, meal plan, shopping list)
document.getElementById('toggle-recipes').addEventListener('click', () => {
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    document.getElementById('recipes-section').classList.add('active');
    fetchRecipes(); // Fetch recipes on view
});

document.getElementById('toggle-plan').addEventListener('click', () => {
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    document.getElementById('meal-plan-section').classList.add('active');
});

document.getElementById('toggle-shopping-list').addEventListener('click', () => {
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    document.getElementById('shopping-list-section').classList.add('active');
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    fetchRecipes(e.target.value); // Fetch recipes based on search input
});

// Show recipes section by default on page load
window.onload = () => {
    document.getElementById('toggle-recipes').click();
    fetchRecipes(); // Fetch initial recipes
};



