const API_KEY = "5f8c564bd76247ccb658e942b18f527e"; // Actual API key
const API_URL = "http://localhost:3000/";

const recipesList = document.getElementById("recipes-list");
const mealPlanList = document.getElementById("meal-plan");
const shoppingList = document.getElementById("shopping-list");
const searchInput = document.getElementById("search-input"); // Search input field
const loadingIndicator = document.getElementById("loading"); // Loading indicator
const containerClass = document.getElementById("main-container");
const showMealPlanBtn = document.getElementById("toggle-plan");
const shoppingListBtn = document.getElementById("toggle-shopping-list");
const downloadShoppingList = document.getElementById("download-shopping-list");

// generate Random Id
function generateRandomString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

// fetch shoppinglist eventlistener
shoppingListBtn.addEventListener("click", (e) => {
  fetchShoppingList();
});

// Fetch and display meal plan
showMealPlanBtn.addEventListener("click", (e) => {
  fechAndDisplayMealPlan();
});

let mealPlan = []; // Stores the meal plan data

// Function to display the loading state
function showLoading() {
  loadingIndicator.style.display = "block";
}

// Function to hide the loading state
function hideLoading() {
  loadingIndicator.style.display = "none";
}

// Fetch recipes from Spoonacular API (GET)
async function fetchRecipes(query = "") {
  showLoading();
  const url = query ? `${API_URL}recipes?query=${query}` : `${API_URL}recipes`;
  console.log(url);

  try {
    const response = await fetch(url);
    const data = await response.json();
    displayRecipes(data);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    alert("Failed to load recipes. Please try again later.");
  } finally {
    hideLoading();
  }
}

// Display recipes in the DOM
function displayRecipes(recipes) {
  recipesList.innerHTML = "";
  recipes.forEach((recipe) => {
    const recipeElement = document.createElement("div");
    recipeElement.classList.add("recipe-item");
    recipeElement.innerHTML = `
            <h3>${recipe.title}</h3>
            <button class="view-recipe" data-id="${recipe.id}">View Details</button>
            <button class="add-to-plan" data-id="${recipe.id}">Add to Meal Plan</button>
        `;
    recipesList.appendChild(recipeElement);

    // Add event listener to view details
    recipeElement
      .querySelector(".view-recipe")
      .addEventListener("click", () => viewRecipeDetails(recipe.id));

    // Add event listener to add to meal plan
    recipeElement
      .querySelector(".add-to-plan")
      .addEventListener("click", () => addRecipeToPlan(recipe));
  });
}

// View detailed recipe (ingredients and instructions)
async function viewRecipeDetails(recipeId) {
  const url = `${API_URL}recipeData/${recipeId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    displayRecipeModal(data);
  } catch (error) {
    console.error("Error fetching recipe details:", error);
  }
}

// Display the modal with recipe details
function displayRecipeModal(recipe) {
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${recipe.title}</h2>
            <h3>Ingredients:</h3>
            <ul>
                ${recipe.extendedIngredients
                  .map((ingredient) => `<li>${ingredient.original}</li>`)
                  .join("")}
            </ul>
            <h3>Instructions:</h3>
            <p>${recipe.instructions}</p>
        </div>
    `;
  containerClass.appendChild(modal);

  // Close modal functionality
  modal.querySelector(".close").addEventListener("click", () => modal.remove());

  // Close modal if clicking outside the content
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Add recipe to weekly meal plan (POST)
async function addRecipeToPlan(recipe) {
  const mealDay = prompt(
    "Which day would you like to add this to (e.g., Monday)?"
  );
  const mealTime = prompt("Which meal time? (e.g., dinner)");

  const mealItem = { recipe, day: mealDay, time: mealTime };

  mealPlan.push(mealItem);

  // Update the meal plan UI
  createShoppingList(recipe);

  // POST new meal plan item to backend
  try {
    await fetch(`${API_URL}meal-plan`, {
      method: "POST",
      mode: "no-cors", // This disables the CORS check
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mealItem),
    });
  } catch (error) {
    console.error("Error adding to meal plan:", error);
  }
}

// Trigger shopping list download process
downloadShoppingList.addEventListener("click", (e) => {
  generateShoppingList();
});

// Generate shopping list
async function generateShoppingList() {
  const response = await fetch(`${API_URL}shopping-list`);
  const data = await response.json();

  var shoppingList = [];

  for (const listItem of data) {
    try {
      const response = await fetch(
        `${API_URL}recipeData/${listItem.recipe.id}`
      );
      const recipe = await response.json();

      recipe.extendedIngredients.forEach((ingredient) => {
        if (!shoppingList.includes(ingredient.original)) {
          shoppingList.push(
            "Recipe Title: " + recipe.title,
            ingredient.original
          );
        }
      });
    } catch (error) {
      console.log("Error occurred when dowloading shopping list: " + error);
    }
  }

  const data2 = { shoppingList };
  downloadPDF(data2, "shopping_list.pdf");
}

// Helper function to download JSON
function downloadJSON(data, filename) {
  const file = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
}

function downloadPDF(data, filename) {
  // Import jsPDF if using it via npm (if using CDN, it's available globally)
  const { jsPDF } = window.jspdf;

  // Create a new PDF document
  const doc = new jsPDF();

  // Add title to PDF
  doc.text("Shopping List", 20, 10); // Title at coordinates (20, 10)

  // Add each item in the shopping list to the PDF
  let yPosition = 20; // Start the list from below the title
  const lineHeight = 10; // Vertical space between lines
  const maxHeight = 290;
  data.shoppingList.forEach((item, index) => {
    // If the current yPosition exceeds the max height, add a new page
    if (yPosition + lineHeight > maxHeight) {
      doc.addPage(); // Add a new page
      yPosition = 20; // Reset the vertical position on the new page
    }
    doc.text(`${index + 1}. ${item}`, 20, yPosition);
    yPosition += lineHeight; // Increase the vertical position for the next item
  });

  // Trigger the PDF download
  doc.save(filename); 
}

// Create a shopping list
function createShoppingList(recipe) {
  var listBody = new Object();
  listBody.id = generateRandomString();
  listBody.recipe = recipe;

  try {
    fetch(`${API_URL}shopping-list`, {
      method: "POST",
      mode: "no-cors", // This disables the CORS check
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listBody),
    });
  } catch (error) {
    console.error("Error adding to shopping list:", error);
  }
}

// Fetch shopping list
async function fetchShoppingList() {
  const response = await fetch(`${API_URL}shopping-list`);

  const data = await response.json();

  //   fetch individual recipes as per the shopping list id
  data.forEach(async (item) => {
    const shoppingListId = item.id;
    const recipeId = item.recipe.id;
    try {
      const response = await fetch(`${API_URL}recipeData/${recipeId}`);
      const recipe = await response.json();

      //   Create and display then shopping list
      const shoppingItem = document.createElement("li");
      shoppingItem.textContent = `${recipe.title}: ${
        recipe.extendedIngredients
          ? recipe.extendedIngredients
              .map((ingredient) => ingredient.original)
              .join(", ")
          : "No ingredients available"
      }`;
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.classList.add('remove');

      removeButton.addEventListener("click", (e) => {
        deleteShoppingList(shoppingListId);
      });
      shoppingItem.append(removeButton);

      shoppingList.appendChild(shoppingItem);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
    }
  });
}

//delete shopping list
async function deleteShoppingList(shoppingListId) {
  try {
    await fetch(`${API_URL}shopping-list/${shoppingListId}`, {
      method: "DELETE",
    });

    alert("Item deleted Successfully");
  } catch (error) {
    alert("error deleting shopping list :" + error);
  }
}

// Update the shopping list when a recipe is added
function updateShoppingList(recipe) {
  const shoppingItem = document.createElement("li");
  shoppingItem.textContent = `${recipe.title}: ${
    recipe.extendedIngredients
      ? recipe.extendedIngredients
          .map((ingredient) => ingredient.original)
          .join(", ")
      : "No ingredients available"
  }`;
  shoppingList.appendChild(shoppingItem);
}

// Remove recipe from the meal plan
async function removeFromMealPlan(recipeId) {
  mealPlan = mealPlan.filter((item) => item.recipe.id !== recipeId);
  // updateMealPlanUI();
  try {
    await fetch(`${API_URL}meal-plan/${recipeId}`, {
      method: "DELETE",
    });
    console.log("Item deleted successfully");
  } catch (error) {
    console.error("Error deleting item:", error);
  }
}

async function fechAndDisplayMealPlan() {
  mealPlanList.innerHTML = ""; // Clear existing list
  try {
    const response = await fetch(`${API_URL}meal-plan`);
    const data = await response.json();
    data.forEach((item) => {
      const mealItem = document.createElement("li");
      mealItem.textContent = `${item.recipe.title} (${item.day} - ${item.time})`;
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";

      const updateButton = document.createElement("button");
      updateButton.textContent = "Update";

      removeButton.addEventListener("click", () => {
        //alert(item.recipe.id);
        removeFromMealPlan(item.id);
      });
      updateButton.addEventListener("click", () => {
        //alert(item.recipe.id);
        displayMealUpdateModal(item);
      });
      mealItem.appendChild(updateButton);
      mealItem.appendChild(removeButton);

      mealPlanList.appendChild(mealItem);
    });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    alert("Failed to load meal plans. Please try again later.");
  }
}

// Display Meal update modal
function displayMealUpdateModal(mealPlan) {
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${mealPlan.recipe.title}</h2>
            <form id="update-form" >
            <label for="Meal Day">Meal Day</label>
            <input id="meal-day" type="text" value=${mealPlan.day} /> <br>
            <label for="Meal Time">Meal Time</label>
            <input id="meal-time" type="text" value=${mealPlan.time} /> <br>
            <button type="submit" id="update-button">Update</button>
            </form>
        </div>
    `;
  containerClass.appendChild(modal);

  // Close modal functionality
  modal.querySelector(".close").addEventListener("click", () => modal.remove());

  const form = document.getElementById("update-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting

    const mealDay = document.getElementById("meal-day").value;
    const mealTime = document.getElementById("meal-time").value;
    const mealPlanId = mealPlan.id;
    var updateBody = new Object();

    updateBody.day = mealDay;
    updateBody.time = mealTime;
    var jsonBody = JSON.stringify(updateBody);
    alert(jsonBody);

    try {
      fetch(`${API_URL}meal-plan/${mealPlanId}`, {
        method: "PATCH",
        //mode: 'no-cors',  // This disables the CORS check
        headers: { "Content-Type": "application/json" },
        body: jsonBody,
      });
    } catch (error) {
      console.error("Error adding to meal plan:", error);
    }
  });

  // Close modal if clicking outside the content
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Toggle sections (view recipes, meal plan, shopping list)
document.getElementById("toggle-recipes").addEventListener("click", () => {
  document
    .querySelectorAll("section")
    .forEach((section) => section.classList.remove("active"));
  document.getElementById("recipes-section").classList.add("active");
  fetchRecipes(); // Fetch recipes on view
});

document.getElementById("toggle-plan").addEventListener("click", () => {
  document
    .querySelectorAll("section")
    .forEach((section) => section.classList.remove("active"));
  document.getElementById("meal-plan-section").classList.add("active");
});

document
  .getElementById("toggle-shopping-list")
  .addEventListener("click", () => {
    document
      .querySelectorAll("section")
      .forEach((section) => section.classList.remove("active"));
    document.getElementById("shopping-list-section").classList.add("active");
  });

// Export the meal plan and shopping list as JSON
function exportMealPlan() {
  const data = {
    recipes: mealPlan.map((item) => item.recipe),
    shoppingList: generateShoppingList(),
    mealPlan: mealPlan,
  };
  downloadJSON(data, "meal_plan.json");
}

// Search functionality
searchInput.addEventListener("input", (e) => {
  fetchRecipes(e.target.value); // Fetch recipes based on search input
});

// Show recipes section by default on page load
window.onload = () => {
  document.getElementById("toggle-recipes").click();
  fetchRecipes(); // Fetch initial recipes
};
