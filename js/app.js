document.addEventListener('DOMContentLoaded', startApp);
const selectCat = document.getElementById('categorias');
const resultsContainer = document.getElementById('resultado');
const modal = new bootstrap.Modal('#modal', {}); // instancia bootstrap para ventana modal
const favoritesDiv = document.querySelector('.favoritos')
function startApp()
{
    /* Este archivo JS lo utilizan ambos documentos HTML y algunos elementos no estan
    disponibles para ambas paginas, por ejemplo el form con select. Para evitar 
    errores con elementos que no existen en ambos documentos se condiciona la ejecución
    de codigo*/
    if(selectCat)
    {
        selectCat.addEventListener('change', getMeals)
        getCategories()
    }
    if(favoritesDiv)
    {
        getFavoriteMeals();
    }

    function getCategories()
    {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url).then(response => {
            //console.log(response)
            return response.json();
        }).then(data => porcessCategories(data))
    }
    function porcessCategories(data)
    {
        const {categories} = data;

        categories.forEach(element => {
            const {strCategory} = element;
            const optionCat = document.createElement('option');
            optionCat.value = strCategory;
            optionCat.textContent = strCategory;

            selectCat.appendChild(optionCat);
        });
    }
    function getMeals(e)
    {
        const category = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
        fetch(url).then(response => {
            return response.json();
        }).then(data => displayMeals(data.meals))
        .catch(error => console.log(error));
    }
    function displayMeals(meals = [])
    {
        cleanHTML(resultsContainer);
        
        const resultsTitle = document.createElement('h2');
        resultsTitle.classList.add('text-center', 'my-3');
        resultsTitle.textContent = meals.length ? 'Results' : 'There are no results';
        resultsContainer.appendChild(resultsTitle);

        meals.forEach(meal =>{
            const {idMeal, strMeal, strMealThumb} = meal
            const $mealContainer = document.createElement('div'); //container
            $mealContainer.classList.add('col-md-4');

            const $mealCard = document.createElement('div'); //card
            $mealCard.classList.add('card', 'mb-4');
            
            const $mealImage = document.createElement('img'); //imagen
            $mealImage.classList.add('card-image-top');
            $mealImage.alt = strMeal;
            $mealImage.src = strMealThumb ?? meal.image;

            const $mealCardBody = document.createElement('div'); //body
            $mealCardBody.classList.add('card-body');

            const $title = document.createElement('h3');//title
            $title.textContent = `${strMeal ?? meal.meal}`
            $title.classList.add('card-title', 'mb-3');

            const $btnVer = document.createElement('button');//button
            $btnVer.classList.add('btn', 'btn-info', 'w-100');
            $btnVer.textContent = 'Watch Recipe';
            $btnVer.onclick = () =>{
                displayModal(idMeal ?? meal.id)   
            }

            $mealCardBody.appendChild($title);
            $mealCardBody.appendChild($btnVer);

            $mealCard.appendChild($mealImage);
            $mealCard.appendChild($mealCardBody);

            $mealContainer.appendChild($mealCard);

            resultsContainer.appendChild($mealContainer);
        })
    }
    function displayModal(id)
    {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
        .then(response => response.json())
        .then(response => getInfo(response.meals [0]))
        .catch(error => console.log(error))
    }
    function getInfo(data)
    {
        const {idMeal, strMeal, strMealThumb, strInstructions} = data;
        modal.show()
        const modalTitle = document.querySelector('.modal-title');
        const modalBody = document.querySelector('.modal-body');

        modalTitle.textContent = `${strMeal}`;
        modalBody.innerHTML = `
        <img class="img-fluid" src="${strMealThumb}" alt="meal ${strMeal}">
        <h3 class="my-3">Instructions</h3>
        <p>${strInstructions}</p>
        `

        const ingredientsTitle = document.createElement('h3');
        ingredientsTitle.textContent = 'Ingredients & Quantities';

        const ingredientsUl = document.createElement('ul');
        ingredientsUl.classList.add('list-group');
        for(let i = 1; i <= 20; i++)
        {
            if(data[`strIngredient${i}`])
            {
                const ingredient = data[`strIngredient${i}`];
                const quantity = data[`strMeasure${i}`];

                const ingredientLi = document.createElement('li');
                ingredientLi.classList.add('list-group-item');
                ingredientLi.textContent = `${ingredient} - ${quantity}`

                ingredientsUl.appendChild(ingredientLi);
            }
            
        }
        modalBody.appendChild(ingredientsTitle);
        modalBody.appendChild(ingredientsUl);

        const modalFooter = document.querySelector('.modal-footer');
        cleanHTML(modalFooter);

        const btnSave = document.createElement('button');    // modal buttons
        const btnClose = document.createElement('button');

        btnSave.classList.add('btn', 'btn-info', 'col');
        btnClose.classList.add('btn', 'btn-danger', 'col');

        btnSave.textContent = proveExistenceOfElement(idMeal) ? 'Remove from Favorites' : 'Save As Favorite'
        btnClose.textContent = 'Close';

        btnClose.onclick = () =>{
            modal.hide();
        }
        modalFooter.appendChild(btnSave);
        modalFooter.appendChild(btnClose);
        
        btnSave.onclick = function()    // event onclick btn Save As Favorite
        {
            if(proveExistenceOfElement(idMeal)) // if exists execute
            {
                displayToast('Meal Has Been Removed From Favorites')
                deleteFavoriteMeal(idMeal);
                btnSave.textContent = 'Save As Favorite';
                return
            }
            btnSave.textContent = 'Remove from Favorites';
            saveFavoriteMeal(
                {
                    id : idMeal,
                    meal : strMeal,
                    image : strMealThumb
                }
            );
            displayToast('Meal Successfully Saved As Favorite')
        }
    }
    function displayToast(message)
    {
        const divToast = document.querySelector('#toast');
        const bodyToast = document.querySelector('.toast-body');
        bodyToast.textContent = message;

        const toast = new bootstrap.Toast(divToast);
        toast.show()
    }
    function saveFavoriteMeal(meal)
    {
        const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
        localStorage.setItem('favorites', JSON.stringify([...favorites, meal]));
    }
    function deleteFavoriteMeal(id)
    {
        const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
        const updatedFavorites = favorites.filter(fav => fav.id !== id);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    }
    function proveExistenceOfElement(id)
    {
        const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
        return favorites.some(favorite => favorite.id === id);
    }
    function getFavoriteMeals()
    {
        // comprobando que haya elementos en localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
        if(favorites.length)
        {
            displayMeals(favorites)
            return
        }
        const noFavorites = document.createElement('div');
        noFavorites.classList.add('fs-4', 'text-center', 'mt-5');
        noFavorites.textContent = "You haven't added any favorite meal yet";
        favoritesDiv.appendChild(noFavorites);
    }
    function cleanHTML(selector)
    {
            while(selector.firstChild)
            {
                selector.removeChild(selector.firstChild)
            }
    }
    
}
