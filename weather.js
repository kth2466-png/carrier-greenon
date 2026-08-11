// API가 느리거나 오프라인이어도 홈 화면이 비지 않도록 서울 샘플 날씨를 기본값으로 둡니다.
const sampleWeather = {
  location: "서울",
  temperature: 31.5,
  humidity: 68,
  apparentTemperature: 33.2,
  weatherCode: 1,
};

const weatherState = {
  ...sampleWeather,
  latitude: 37.5665,
  longitude: 126.978,
  source: "sample",
};

const weatherElements = {
  card: document.querySelector("#weather-card"),
  source: document.querySelector("#weather-source"),
  sourceText: document.querySelector("#weather-source-text"),
  icon: document.querySelector("#weather-icon"),
  location: document.querySelector("#weather-location"),
  condition: document.querySelector("#weather-condition"),
  temperature: document.querySelector("#weather-temperature"),
  humidity: document.querySelector("#weather-humidity"),
  apparent: document.querySelector("#weather-apparent"),
  missionTitle: document.querySelector("#weather-mission-title"),
  missionMessage: document.querySelector("#weather-mission-message"),
  error: document.querySelector("#weather-error"),
  locationButton: document.querySelector("#weather-location-button"),
  refreshButton: document.querySelector("#weather-refresh-button"),
};

/** WMO 날씨 코드를 친근한 한글 상태와 아이콘으로 바꿉니다. */
function describeWeather(code) {
  if (code === 0) return { label: "맑음", icon: "☀️" };
  if ([1, 2].includes(code)) return { label: "대체로 맑음", icon: "🌤️" };
  if (code === 3) return { label: "흐림", icon: "☁️" };
  if ([45, 48].includes(code)) return { label: "안개", icon: "🌫️" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "비", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "눈", icon: "🌨️" };
  if ([95, 96, 99].includes(code)) return { label: "뇌우", icon: "⛈️" };
  return { label: "날씨 정보", icon: "🌤️" };
}

/** 외부 온도와 습도에 따라 오늘 실천하기 좋은 냉방 습관을 안내합니다. */
function getWeatherMission(temperature, humidity) {
  if (temperature >= 30) return { title: "더운 날 추천 미션", message: "26℃ 이상 친환경 냉방으로 시원함과 에너지 절약을 함께 실천해요." };
  if (humidity >= 70) return { title: "습한 날 추천 미션", message: "짧게 제습한 뒤 26℃ 냉방으로 전환해 과도한 전력 사용을 줄여요." };
  if (temperature < 26) return { title: "선선한 날 추천 미션", message: "창문을 열어 자연 바람을 이용하고 에어컨은 잠시 쉬게 해요." };
  return { title: "오늘의 추천 미션", message: "26℃ 이상을 유지하고 필요한 공간만 효율적으로 냉방해요." };
}

function renderWeather() {
  const description = describeWeather(weatherState.weatherCode);
  const recommendation = getWeatherMission(weatherState.temperature, weatherState.humidity);
  const isError = weatherState.source === "error";
  const isLive = weatherState.source === "live";

  weatherElements.location.textContent = weatherState.location;
  weatherElements.condition.textContent = description.label;
  weatherElements.icon.textContent = description.icon;
  weatherElements.temperature.textContent = weatherState.temperature.toFixed(1);
  weatherElements.humidity.textContent = Math.round(weatherState.humidity);
  weatherElements.apparent.textContent = weatherState.apparentTemperature.toFixed(1);
  weatherElements.missionTitle.textContent = recommendation.title;
  weatherElements.missionMessage.textContent = recommendation.message;
  weatherElements.card.classList.toggle("is-error", isError);
  weatherElements.source.classList.toggle("is-error", isError);
  weatherElements.source.classList.toggle("is-live", isLive);
  weatherElements.sourceText.textContent = isLive ? "실시간 API" : isError ? "연결 실패 · 샘플" : "샘플 데이터";
  weatherElements.error.hidden = !isError;
}

/** Open-Meteo의 current 응답만 요청해 전송량을 작게 유지합니다. */
async function loadWeather() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  weatherElements.refreshButton.disabled = true;

  try {
    const parameters = new URLSearchParams({
      latitude: String(weatherState.latitude),
      longitude: String(weatherState.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code",
      timezone: "Asia/Seoul",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Weather API ${response.status}`);
    const data = await response.json();
    if (!data.current) throw new Error("현재 날씨 데이터 없음");

    weatherState.temperature = Number(data.current.temperature_2m);
    weatherState.humidity = Number(data.current.relative_humidity_2m);
    weatherState.apparentTemperature = Number(data.current.apparent_temperature);
    weatherState.weatherCode = Number(data.current.weather_code);
    weatherState.source = "live";
  } catch (_error) {
    Object.assign(weatherState, sampleWeather, { source: "error" });
  } finally {
    window.clearTimeout(timeout);
    weatherElements.refreshButton.disabled = false;
    renderWeather();
  }
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    weatherState.source = "error";
    renderWeather();
    return;
  }

  weatherElements.locationButton.disabled = true;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      weatherState.latitude = position.coords.latitude;
      weatherState.longitude = position.coords.longitude;
      weatherState.location = "현재 위치";
      await loadWeather();
      weatherElements.locationButton.disabled = false;
    },
    () => {
      weatherElements.locationButton.disabled = false;
      weatherState.source = "error";
      renderWeather();
    },
    { enableHighAccuracy: false, timeout: 7000, maximumAge: 600000 },
  );
}

weatherElements.refreshButton.addEventListener("click", loadWeather);
weatherElements.locationButton.addEventListener("click", useCurrentLocation);
renderWeather();
loadWeather();
