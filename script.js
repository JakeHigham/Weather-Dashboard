document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'f2f0cf4c63998f08aa14fd00933d044e';

    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const weatherInfo = document.getElementById('weather-info');
    const forecastInfo = document.getElementById('forecast-info');
    const recentCitiesList = document.getElementById('recent-cities-list');

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const cityName = cityInput.value.trim();

        if (cityName !== '') {
            showLoadingIndicator();
            getWeatherData(cityName);

            // Save recent city to local storage
            saveRecentCity(cityName);
        }
    });

    recentCitiesList.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const cityName = event.target.textContent;
            showLoadingIndicator();
            getWeatherData(cityName);
        }
    });

    function showLoadingIndicator() {
        forecastInfo.innerHTML = '<p>Loading...</p>';
    }

    function saveRecentCity(cityName) {
        // Load recent cities from local storage
        const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

        // Check if the city is already in the recent cities list
        if (!recentCities.includes(cityName)) {
            // Add the city to the beginning of the list
            recentCities.unshift(cityName);

            // Limit the list to a certain number of recent cities (e.g., 5)
            if (recentCities.length > 5) {
                recentCities.pop();
            }

            // Save the updated recent cities list to local storage
            localStorage.setItem('recentCities', JSON.stringify(recentCities));

            // Update the UI with the latest recent cities
            updateRecentCitiesUI();
        }
    }

    function updateRecentCitiesUI() {
        // Clear existing content
        recentCitiesList.innerHTML = '';

        // Display recent cities on the webpage
        const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
        recentCities.forEach(city => {
            const listItem = document.createElement('li');
            listItem.textContent = city;
            recentCitiesList.appendChild(listItem);
        });
    }

    function getWeatherData(cityName) {
        const geoApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

        fetch(geoApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch weather data. Status: ${response.status}`);
                }
                return response.json();
            })
            .then(geoData => {
                const { lat, lon } = geoData.coord;
                const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

                fetch(forecastApiUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch forecast data. Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(forecastData => {
                        updateWeatherUI(forecastData);
                    })
                    .catch(error => {
                        showError('Error fetching forecast data.');
                        console.error('Error fetching forecast data:', error);
                    });
            })
            .catch(error => {
                showError('Error fetching geographical coordinates.');
                console.error('Error fetching geographical coordinates:', error);
            });
    }

    function updateWeatherUI(data) {
        weatherInfo.innerHTML = '';
        forecastInfo.innerHTML = '';
    
        console.log('Current Weather Data:', data.list[0]);
    
        const currentWeather = data.list[0].main;
        const forecastList = data.list; 
    
        const currentTemperatureUS = convertToUSUnits(currentWeather.temp);
        const currentWind = data.list[0].wind; // Extract wind information for the current time
        const currentWindSpeedUS = convertToUSUnits(currentWind.speed, false); // Use wind speed from current time, otherwise will display wrong wind speed
    
        const currentWeatherHTML = `
            <p>Temp: ${currentTemperatureUS} °F</p>
            <p>Humidity: ${currentWeather.humidity}%</p>
            <p>Wind: ${currentWindSpeedUS} mph</p>
        `;
        weatherInfo.innerHTML = currentWeatherHTML;
    
        for (let i = 1; i < forecastList.length; i += 8) {
            const forecast = forecastList[i].main;
            const forecastDate = new Date(forecastList[i].dt_txt);
    
            const forecastTemperatureUS = convertToUSUnits(forecast.temp);
            const forecastWindSpeedUS = convertToUSUnits(forecastList[i].wind.speed, false);
    
            const forecastHTML = `
                <div class="forecast-item">
                    <p>Date: ${forecastDate.toDateString()}</p>
                    <p>Temp: ${forecastTemperatureUS} °F</p>
                    <p>Humidity: ${forecast.humidity}%</p>
                    <p>Wind: ${forecastWindSpeedUS} mph</p>
                </div>
            `;
            forecastInfo.innerHTML += forecastHTML;
        }
    }
    // Without this function, will display data in metric
    function convertToUSUnits(metricValue, isTemperature = true) {
        if (isTemperature) {
            // Convert Kelvin to Fahrenheit
            return Math.round((metricValue - 273.15) * 9/5 + 32);
        } else {
            // Convert meters per second to miles per hour for wind speed
            return Math.round(metricValue * 2.23694);
        }
    }

    function showError(message) {
        forecastInfo.innerHTML = `<p>Error: ${message}</p>`;
    }

    
    updateRecentCitiesUI();
});
