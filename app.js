// Carrier GreenON의 화면 요소를 한곳에서 찾아 이후 로직을 읽기 쉽게 정리합니다.
const views = [...document.querySelectorAll("[data-view]")];
const navigationButtons = [...document.querySelectorAll("[data-nav-target]")];
const bottomNavigationButtons = [...document.querySelectorAll(".nav-item")];
const toast = document.querySelector(".toast");
const todayLabel = document.querySelector("#today-label");

// 브라우저에는 공개 가능한 Publishable Key만 전달하며 service_role 키는 사용하지 않습니다.
const supabaseClient = window.supabase && window.GREENON_CONFIG
  ? window.supabase.createClient(
      window.GREENON_CONFIG.supabaseUrl,
      window.GREENON_CONFIG.supabasePublishableKey,
    )
  : null;

let currentUser = null;
let currentProfile = null;
let authMode = "login";
let dataLoading = false;

// 가상 Carrier 에어컨의 현재 상태입니다. 실제 제조사 API나 외부 서버에는 연결하지 않습니다.
const airconState = {
  power: true,
  mode: "냉방",
  temperature: 26,
  fan: "자동",
  usageMinutes: 80,
  filter: "clean",
  sensor: "normal",
};

const airconElements = {
  card: document.querySelector("#aircon-card"),
  deviceState: document.querySelector("#device-state"),
  deviceStateText: document.querySelector("#device-state-text"),
  power: document.querySelector("#power-value"),
  mode: document.querySelector("#mode-value"),
  temperature: document.querySelector("#temperature-value"),
  controlTemperature: document.querySelector("#control-temperature"),
  fan: document.querySelector("#fan-value"),
  usage: document.querySelector("#usage-value"),
  filter: document.querySelector("#filter-value"),
  sensor: document.querySelector("#sensor-value"),
  filterStat: document.querySelector("#filter-stat"),
  sensorStat: document.querySelector("#sensor-stat"),
  warning: document.querySelector("#aircon-warning"),
  warningTitle: document.querySelector("#warning-title"),
  warningMessage: document.querySelector("#warning-message"),
  powerToggle: document.querySelector("#power-toggle"),
  powerToggleLabel: document.querySelector("#power-toggle-label"),
  fanControl: document.querySelector("#fan-control"),
};

// 로그인 사용자의 오늘 미션 상태를 Supabase user_missions 행과 동기화합니다.
const userMission = {
  id: null,
  missionId: null,
  status: "available",
  elapsedMinutes: 0,
  targetMinutes: 120,
  rewardGranted: false,
};

// 포인트 잔액은 Supabase 거래 내역의 합계로 계산해 숫자와 기록이 어긋나지 않게 합니다.
const pointWallet = {
  balance: 0,
  filter: "all",
  transactions: [],
};

const missionElements = {
  card: document.querySelector("#mission-card"),
  status: document.querySelector("#mission-status"),
  progressText: document.querySelector("#mission-progress-text"),
  progressBar: document.querySelector("#mission-progress-bar"),
  progressTrack: document.querySelector(".progress-track"),
  elapsed: document.querySelector("#mission-elapsed"),
  alert: document.querySelector("#mission-alert"),
  alertTitle: document.querySelector("#mission-alert-title"),
  alertMessage: document.querySelector("#mission-alert-message"),
  start: document.querySelector("#mission-start"),
  time: document.querySelector("#mission-time"),
  conditionPower: document.querySelector("#condition-power"),
  conditionTemperature: document.querySelector("#condition-temperature"),
  conditionDevice: document.querySelector("#condition-device"),
};

const walletElements = {
  balance: document.querySelector("#wallet-balance"),
  list: document.querySelector("#transaction-list"),
  filters: [...document.querySelectorAll("[data-point-filter]")],
};

// 로그인 전에도 화면 구조를 볼 수 있는 기본 목록이며, 로그인하면 Supabase rewards 데이터로 교체됩니다.
let rewards = [
  { id: "food-coffee", category: "food", name: "아이스 아메리카노", price: 50, icon: "☕", description: "시원한 아메리카노 모바일 교환권이에요." },
  { id: "food-juice", category: "food", name: "청포도 에이드", price: 80, icon: "🥤", description: "상큼한 청포도 에이드 모바일 교환권이에요." },
  { id: "life-tumbler", category: "life", name: "GreenON 텀블러", price: 120, icon: "🥛", description: "일회용 컵을 줄이는 친환경 다회용 텀블러예요." },
  { id: "life-bag", category: "life", name: "리사이클 에코백", price: 160, icon: "👜", description: "재활용 원단으로 만든 가벼운 데일리 에코백이에요." },
  { id: "carrier-filter", category: "carrier", name: "에어컨 필터 케어", price: 300, icon: "❄️", description: "쾌적한 냉방을 위한 캐리어 필터 케어 혜택이에요." },
  { id: "carrier-kit", category: "carrier", name: "GreenON 홈 키트", price: 450, icon: "🏠", description: "친환경 냉방 생활을 돕는 Carrier GreenON 키트예요." },
];

const rewardShop = { category: "all", selectedRewardId: null, orders: [] };
const categoryNames = { food: "FOOD", life: "LIFE", carrier: "CARRIER" };

const shopElements = {
  balance: document.querySelector("#shop-balance"),
  grid: document.querySelector("#reward-grid"),
  categories: [...document.querySelectorAll("[data-reward-category]")],
  orderList: document.querySelector("#order-list"),
  modal: document.querySelector("#reward-modal"),
  detailImage: document.querySelector("#reward-detail-image"),
  detailCategory: document.querySelector("#reward-detail-category"),
  detailName: document.querySelector("#reward-detail-name"),
  detailDescription: document.querySelector("#reward-detail-description"),
  detailPrice: document.querySelector("#reward-detail-price"),
  warning: document.querySelector("#purchase-warning"),
  purchase: document.querySelector("#purchase-button"),
};

const authElements = {
  card: document.querySelector("#auth-card"),
  dashboard: document.querySelector("#profile-dashboard"),
  tabs: [...document.querySelectorAll("[data-auth-mode]")],
  form: document.querySelector("#auth-form"),
  nameField: document.querySelector("#auth-name-field"),
  name: document.querySelector("#auth-name"),
  email: document.querySelector("#auth-email"),
  password: document.querySelector("#auth-password"),
  message: document.querySelector("#auth-message"),
  submit: document.querySelector("#auth-submit"),
  title: document.querySelector("#auth-title"),
  subtitle: document.querySelector("#auth-subtitle"),
  logout: document.querySelector("#logout-button"),
  profileName: document.querySelector("#profile-name"),
  profileEmail: document.querySelector("#profile-email"),
  profileInitial: document.querySelector("#profile-initial"),
  profileLevel: document.querySelector("#profile-level"),
  reportMissions: document.querySelector("#report-missions"),
  reportPoints: document.querySelector("#report-points"),
  reportOrders: document.querySelector("#report-orders"),
};

let toastTimer;

/**
 * 사용자가 선택한 메뉴 화면만 보여 줍니다.
 * 현재 단계에서는 홈 화면 외 메뉴는 이후 기능을 위한 안내 화면으로 연결됩니다.
 */
function showView(targetName) {
  const targetView = views.find((view) => view.dataset.view === targetName);

  // 잘못된 화면 이름이 들어오면 빈 화면이 되지 않도록 홈으로 안전하게 돌아갑니다.
  if (!targetView) {
    showView("home");
    return;
  }

  views.forEach((view) => {
    const isTarget = view === targetView;
    view.hidden = !isTarget;
    view.classList.toggle("is-active", isTarget);
  });

  bottomNavigationButtons.forEach((button) => {
    const isActive = button.dataset.navTarget === targetName;
    button.classList.toggle("is-active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  // 메뉴를 바꿀 때 콘텐츠의 시작점으로 이동해 모바일에서도 맥락을 잃지 않게 합니다.
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${targetName}`);
}

/**
 * 아직 연결되지 않은 기능을 눌렀을 때 간단한 안내 메시지를 표시합니다.
 */
function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;

  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

/**
 * 분 단위 사용시간을 사용자가 읽기 쉬운 '시간/분' 형식으로 바꿉니다.
 */
function formatUsageTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

/**
 * airconState의 값을 화면 전체에 반영합니다.
 * 위험 상태는 필터 또는 센서에 문제가 있을 때만 Red UI로 표시합니다.
 */
function renderAirconState() {
  const hasFilterWarning = airconState.filter === "check";
  const hasSensorError = airconState.sensor === "error";
  const hasDanger = hasFilterWarning || hasSensorError;

  airconElements.power.textContent = airconState.power ? "ON" : "OFF";
  airconElements.mode.textContent = airconState.power ? `${airconState.mode} 운전 중` : "운전 정지";
  airconElements.temperature.textContent = airconState.temperature;
  airconElements.controlTemperature.textContent = airconState.temperature;
  airconElements.fan.textContent = airconState.power ? airconState.fan : "정지";
  airconElements.usage.textContent = formatUsageTime(airconState.usageMinutes);
  airconElements.filter.textContent = hasFilterWarning ? "점검 필요" : "깨끗함";
  airconElements.sensor.textContent = hasSensorError ? "연결 오류" : "정상";

  airconElements.card.classList.toggle("is-danger", hasDanger);
  airconElements.filterStat.classList.toggle("is-danger", hasFilterWarning);
  airconElements.sensorStat.classList.toggle("is-danger", hasSensorError);
  airconElements.warning.hidden = !hasDanger;

  airconElements.powerToggle.classList.toggle("is-on", airconState.power);
  airconElements.powerToggle.setAttribute("aria-checked", String(airconState.power));
  airconElements.powerToggleLabel.textContent = airconState.power ? "ON" : "OFF";
  airconElements.fanControl.textContent = airconState.fan;

  if (hasSensorError) {
    airconElements.deviceStateText.textContent = "센서 오류";
    airconElements.warningTitle.textContent = "센서 연결을 확인해 주세요";
    airconElements.warningMessage.textContent = "온도 센서 데이터를 불러올 수 없습니다. 시뮬레이션 상태를 정상으로 변경해 주세요.";
  } else if (hasFilterWarning) {
    airconElements.deviceStateText.textContent = "필터 점검";
    airconElements.warningTitle.textContent = "필터 점검이 필요해요";
    airconElements.warningMessage.textContent = "깨끗한 공기와 효율적인 냉방을 위해 필터를 청소해 주세요.";
  } else {
    airconElements.deviceStateText.textContent = airconState.power ? "정상 운전" : "전원 꺼짐";
  }

  renderMissionState();
}

/**
 * 현재 가상 에어컨 상태가 오늘의 친환경 미션 조건을 만족하는지 계산합니다.
 */
function getMissionConditions() {
  return {
    power: airconState.power && airconState.mode === "냉방",
    temperature: airconState.temperature >= 26,
    device: airconState.filter === "clean" && airconState.sensor === "normal",
  };
}

function areMissionConditionsValid() {
  return Object.values(getMissionConditions()).every(Boolean);
}

/**
 * 에어컨 조건과 사용자 참여 상태를 GREEN MISSION 카드에 그립니다.
 */
function renderMissionState() {
  const conditions = getMissionConditions();
  const progress = Math.min(100, Math.round((userMission.elapsedMinutes / userMission.targetMinutes) * 100));
  const isActive = userMission.status === "active";
  const isSuccess = userMission.status === "success";
  const isFailed = userMission.status === "failed";
  const isInvalid = !areMissionConditionsValid();

  missionElements.conditionPower.classList.toggle("is-invalid", !conditions.power);
  missionElements.conditionTemperature.classList.toggle("is-invalid", !conditions.temperature);
  missionElements.conditionDevice.classList.toggle("is-invalid", !conditions.device);
  missionElements.card.classList.toggle("is-active", isActive);
  missionElements.card.classList.toggle("is-success", isSuccess);
  missionElements.card.classList.toggle("is-failed", isFailed);
  missionElements.progressText.textContent = `${progress}%`;
  missionElements.progressBar.style.width = `${progress}%`;
  missionElements.progressTrack.setAttribute("aria-valuenow", String(progress));
  missionElements.elapsed.textContent = `${userMission.elapsedMinutes}분 진행`;
  missionElements.time.hidden = !isActive;

  if (isSuccess) {
    missionElements.status.textContent = "미션 성공";
    missionElements.start.textContent = "오늘의 미션 완료";
    missionElements.start.disabled = true;
    missionElements.alert.hidden = true;
    return;
  }

  if (isFailed) {
    missionElements.status.textContent = "미션 실패";
    missionElements.start.textContent = "다시 도전하기";
    missionElements.start.disabled = false;
    missionElements.alert.hidden = false;
    missionElements.alertTitle.textContent = "미션 조건을 유지하지 못했어요";
    missionElements.alertMessage.textContent = "에어컨 상태를 정상으로 맞춘 뒤 다시 도전해 주세요.";
    return;
  }

  missionElements.start.disabled = false;
  missionElements.status.textContent = isActive ? "진행 중" : "참여 가능";
  missionElements.start.textContent = isActive ? "미션 진행 중" : "미션 시작하기";

  if (isInvalid) {
    missionElements.alert.hidden = false;
    missionElements.alertTitle.textContent = "미션 조건을 확인해 주세요";
    missionElements.alertMessage.textContent = "전원·온도·기기 상태를 모두 정상 조건으로 맞춰야 시간이 인정돼요.";
  } else {
    missionElements.alert.hidden = true;
  }
}

/**
 * GREEN POINT 거래 한 건을 추가하고 잔액을 같은 금액만큼 갱신합니다.
 */
function calculatePointBalance() {
  pointWallet.balance = pointWallet.transactions.reduce((balance, transaction) => {
    return balance + (transaction.type === "earn" ? transaction.amount : -transaction.amount);
  }, 0);
}

function renderWallet() {
  walletElements.balance.textContent = pointWallet.balance.toLocaleString("ko-KR");
  shopElements.balance.textContent = pointWallet.balance.toLocaleString("ko-KR");

  const visibleTransactions = pointWallet.filter === "all"
    ? pointWallet.transactions
    : pointWallet.transactions.filter((transaction) => transaction.type === pointWallet.filter);

  walletElements.filters.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.pointFilter === pointWallet.filter);
  });

  if (visibleTransactions.length === 0) {
    const emptyMessage = pointWallet.filter === "use"
      ? "아직 사용한 포인트가 없어요.<br>리워드 숍에서 첫 리워드를 만나 보세요."
      : "아직 포인트 내역이 없어요.<br>GREEN MISSION에 도전해 보세요.";
    walletElements.list.innerHTML = `<div class="transaction-empty">${emptyMessage}</div>`;
    return;
  }

  walletElements.list.innerHTML = visibleTransactions.map((transaction) => {
    const isEarn = transaction.type === "earn";
    const date = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(transaction.createdAt);
    return `
      <article class="transaction-item ${isEarn ? "is-earn" : "is-use"}">
        <span class="transaction-icon" aria-hidden="true">${isEarn ? "🌱" : "🎁"}</span>
        <div class="transaction-info"><strong>${transaction.description}</strong><span>${date}</span></div>
        <span class="transaction-amount">${isEarn ? "+" : "−"}${transaction.amount.toLocaleString("ko-KR")} P</span>
      </article>`;
  }).join("");
}

/**
 * Supabase point_transactions를 다시 읽어 지갑과 GREEN REPORT를 갱신합니다.
 */
async function loadPointData() {
  if (!currentUser || !supabaseClient) return;
  const { data, error } = await supabaseClient
    .from("point_transactions")
    .select("id, transaction_type, amount, description, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  pointWallet.transactions = (data ?? []).map((transaction) => ({
    id: transaction.id,
    type: transaction.transaction_type,
    amount: transaction.amount,
    description: transaction.description,
    createdAt: new Date(transaction.created_at),
  }));
  calculatePointBalance();
  renderWallet();
}

function getSeoulDate() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function applyAirconRecord(record) {
  if (!record) return;
  const modeNames = { cool: "냉방", fan: "송풍", dry: "제습", auto: "자동" };
  const fanNames = { auto: "자동", low: "약풍", medium: "중풍", high: "강풍" };
  airconState.power = record.power;
  airconState.mode = modeNames[record.mode] ?? "냉방";
  airconState.temperature = Number(record.temperature);
  airconState.fan = fanNames[record.fan] ?? "자동";
  airconState.usageMinutes = record.usage_minutes;
  airconState.filter = record.filter_status;
  airconState.sensor = record.sensor_status;
}

/**
 * 가상 IoT 값은 로그인 사용자의 aircon_status 한 행에 upsert합니다.
 */
async function persistAirconState() {
  if (!currentUser || !supabaseClient) return;
  const modeValues = { 냉방: "cool", 송풍: "fan", 제습: "dry", 자동: "auto" };
  const fanValues = { 자동: "auto", 약풍: "low", 중풍: "medium", 강풍: "high" };
  const { error } = await supabaseClient.from("aircon_status").upsert({
    user_id: currentUser.id,
    power: airconState.power,
    mode: modeValues[airconState.mode] ?? "cool",
    temperature: airconState.temperature,
    fan: fanValues[airconState.fan] ?? "auto",
    usage_minutes: airconState.usageMinutes,
    filter_status: airconState.filter,
    sensor_status: airconState.sensor,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

function resetUserData() {
  currentProfile = null;
  userMission.id = null;
  userMission.missionId = null;
  userMission.status = "available";
  userMission.elapsedMinutes = 0;
  userMission.rewardGranted = false;
  pointWallet.transactions = [];
  pointWallet.balance = 0;
  rewardShop.orders = [];
  renderAirconState();
  renderWallet();
  renderOrders();
}

/**
 * 로그인 직후 사용자 소유 데이터와 공개 카탈로그를 RLS가 적용된 세션으로 읽습니다.
 */
async function loadUserData() {
  if (!currentUser || !supabaseClient || dataLoading) return;
  dataLoading = true;

  try {
    const [profileResult, missionResult, rewardsResult, airconResult, ordersResult] = await Promise.all([
      supabaseClient.from("profiles").select("display_name, green_level").single(),
      supabaseClient.from("missions").select("id, target_minutes, reward_points").eq("is_active", true).order("id").limit(1).single(),
      supabaseClient.from("rewards").select("id, slug, category, name, description, price, icon").eq("is_active", true).order("sort_order"),
      supabaseClient.from("aircon_status").select("power, mode, temperature, fan, usage_minutes, filter_status, sensor_status").single(),
      supabaseClient.from("reward_orders").select("id, points_spent, status, created_at, rewards(name, icon)").order("created_at", { ascending: false }),
    ]);

    const firstError = [profileResult, missionResult, rewardsResult, airconResult, ordersResult].find((result) => result.error)?.error;
    if (firstError) throw firstError;

    currentProfile = profileResult.data;
    userMission.missionId = missionResult.data.id;
    userMission.targetMinutes = missionResult.data.target_minutes;
    rewards = (rewardsResult.data ?? []).map((reward) => ({ ...reward }));
    applyAirconRecord(airconResult.data);
    rewardShop.orders = (ordersResult.data ?? []).map((order) => ({
      id: order.id,
      name: order.rewards?.name ?? "리워드",
      icon: order.rewards?.icon ?? "🎁",
      price: order.points_spent,
      date: new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(order.created_at)),
    }));

    const { data: missionRecord, error: missionError } = await supabaseClient
      .from("user_missions")
      .select("id, status, elapsed_minutes, reward_granted")
      .eq("mission_id", userMission.missionId)
      .eq("mission_date", getSeoulDate())
      .maybeSingle();
    if (missionError) throw missionError;

    if (missionRecord) {
      userMission.id = missionRecord.id;
      userMission.status = missionRecord.status;
      userMission.elapsedMinutes = missionRecord.elapsed_minutes;
      userMission.rewardGranted = missionRecord.reward_granted;
    }

    await loadPointData();
    renderAirconState();
    renderRewards();
    renderOrders();
    renderUser();
  } catch (error) {
    showToast(`데이터를 불러오지 못했어요: ${error.message}`);
  } finally {
    dataLoading = false;
  }
}

function renderRewards() {
  const visibleRewards = rewardShop.category === "all"
    ? rewards
    : rewards.filter((reward) => reward.category === rewardShop.category);

  shopElements.categories.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.rewardCategory === rewardShop.category);
  });

  shopElements.grid.innerHTML = visibleRewards.map((reward) => `
    <button class="reward-card" type="button" data-reward-id="${reward.id}">
      <span class="reward-image" aria-hidden="true">${reward.icon}</span>
      <span class="reward-info"><span class="reward-category-label">${categoryNames[reward.category]}</span><strong>${reward.name}</strong><span class="reward-price">${reward.price.toLocaleString("ko-KR")} P</span></span>
    </button>`).join("");

  document.querySelectorAll("[data-reward-id]").forEach((button) => {
    button.addEventListener("click", () => openRewardDetail(button.dataset.rewardId));
  });
}

function openRewardDetail(rewardId) {
  const reward = rewards.find((item) => String(item.id) === String(rewardId));
  if (!reward) return;
  rewardShop.selectedRewardId = reward.id;
  shopElements.detailImage.textContent = reward.icon;
  shopElements.detailCategory.textContent = categoryNames[reward.category];
  shopElements.detailName.textContent = reward.name;
  shopElements.detailDescription.textContent = reward.description;
  shopElements.detailPrice.textContent = reward.price.toLocaleString("ko-KR");
  shopElements.warning.hidden = true;
  shopElements.modal.hidden = false;
}

function closeRewardDetail() {
  shopElements.modal.hidden = true;
  shopElements.warning.hidden = true;
}

function renderOrders() {
  if (rewardShop.orders.length === 0) {
    shopElements.orderList.innerHTML = '<div class="transaction-empty">아직 구매한 리워드가 없어요.<br>마음에 드는 상품을 골라 보세요.</div>';
    return;
  }

  shopElements.orderList.innerHTML = rewardShop.orders.map((order) => `
    <article class="order-item"><span aria-hidden="true">${order.icon}</span><div><strong>${order.name}</strong><small>구매 완료 · ${order.date}</small></div><span>−${order.price} P</span></article>`).join("");
}

async function purchaseSelectedReward() {
  const reward = rewards.find((item) => String(item.id) === String(rewardShop.selectedRewardId));
  if (!reward) return;

  if (!currentUser || !supabaseClient) {
    closeRewardDetail();
    showView("my");
    showToast("로그인 후 리워드를 구매할 수 있어요.");
    return;
  }

  if (pointWallet.balance < reward.price) {
    shopElements.warning.hidden = false;
    return;
  }

  shopElements.purchase.disabled = true;
  const { error } = await supabaseClient.rpc("purchase_reward", { p_reward_id: reward.id });
  shopElements.purchase.disabled = false;

  if (error) {
    if (/insufficient points/i.test(error.message)) shopElements.warning.hidden = false;
    else showToast("구매 중 문제가 발생했어요. 다시 시도해 주세요.");
    return;
  }

  await loadUserDataAfterPurchase();
  closeRewardDetail();
  showToast(`${reward.name} 구매가 완료됐어요.`);
}

async function loadUserDataAfterPurchase() {
  await loadPointData();
  const { data, error } = await supabaseClient
    .from("reward_orders")
    .select("id, points_spent, status, created_at, rewards(name, icon)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  rewardShop.orders = (data ?? []).map((order) => ({
    id: order.id,
    name: order.rewards?.name ?? "리워드",
    icon: order.rewards?.icon ?? "🎁",
    price: order.points_spent,
    date: new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(order.created_at)),
  }));
  renderOrders();
  renderUser();
}

function showAuthMessage(message, isError = false) {
  authElements.message.textContent = message;
  authElements.message.hidden = false;
  authElements.message.classList.toggle("is-error", isError);
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  authElements.nameField.hidden = !isSignup;
  authElements.password.autocomplete = isSignup ? "new-password" : "current-password";
  authElements.submit.textContent = isSignup ? "회원가입" : "로그인";
  authElements.title.textContent = isSignup ? "GreenON을 시작해 볼까요?" : "다시 만나서 반가워요!";
  authElements.subtitle.textContent = isSignup
    ? "계정을 만들고 나만의 친환경 여정을 기록하세요."
    : "로그인하고 나의 GREEN POINT를 확인하세요.";
  authElements.message.hidden = true;

  authElements.tabs.forEach((button) => {
    const isSelected = button.dataset.authMode === mode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
}

function renderUser() {
  const isSignedIn = Boolean(currentUser);
  authElements.card.hidden = isSignedIn;
  authElements.dashboard.hidden = !isSignedIn;

  if (!currentUser) return;
  const displayName = currentProfile?.display_name || currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0] || "GreenON 사용자";
  authElements.profileName.textContent = displayName;
  authElements.profileEmail.textContent = currentUser.email || "";
  authElements.profileInitial.textContent = displayName.charAt(0).toUpperCase();
  const levelNames = ["SEED", "SPROUT", "LEAF", "TREE", "FOREST"];
  const greenLevel = currentProfile?.green_level ?? 1;
  authElements.profileLevel.textContent = `LEVEL ${greenLevel} · ${levelNames[greenLevel - 1] ?? "SEED"}`;
  authElements.reportMissions.textContent = userMission.status === "success" ? "1" : "0";
  authElements.reportPoints.textContent = `${pointWallet.balance.toLocaleString("ko-KR")} P`;
  authElements.reportOrders.textContent = rewardShop.orders.length;
}

async function submitAuthForm(event) {
  event.preventDefault();

  if (!supabaseClient) {
    showAuthMessage("Supabase 설정을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.", true);
    return;
  }

  const email = authElements.email.value.trim();
  const password = authElements.password.value;
  authElements.submit.disabled = true;
  authElements.message.hidden = true;

  try {
    if (authMode === "signup") {
      const displayName = authElements.name.value.trim() || email.split("@")[0];
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          // 확인 메일을 누른 뒤 localhost가 아니라 현재 배포 사이트의 MY 화면으로 돌아옵니다.
          emailRedirectTo: `${window.location.origin}/#my`,
        },
      });
      if (error) throw error;
      if (!data.session) {
        showAuthMessage("가입 확인 메일을 보냈어요. 이메일 인증 후 로그인해 주세요.");
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (error) {
    // 계정 존재 여부를 구체적으로 노출하지 않고 사용자에게 안전한 공통 메시지를 보여 줍니다.
    showAuthMessage(error?.message || "인증 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", true);
  } finally {
    authElements.submit.disabled = false;
  }
}

async function signOut() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) showToast("로그아웃하지 못했습니다. 다시 시도해 주세요.");
}

async function initializeAuth() {
  if (!supabaseClient) {
    showAuthMessage("Supabase 클라이언트를 불러오지 못했습니다.", true);
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user ?? null;
  renderUser();
  if (currentUser) await loadUserData();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    if (currentUser) {
      renderUser();
      await loadUserData();
      showToast("Carrier GreenON에 로그인했어요.");
    } else {
      resetUserData();
      renderUser();
    }
  });
}

/**
 * +30분 시뮬레이션을 실행하고, 진행 중인 미션의 조건과 성공 여부를 확인합니다.
 */
async function simulateThirtyMinutes() {
  airconState.usageMinutes += 30;

  if (userMission.status === "active") {
    if (!areMissionConditionsValid()) {
      userMission.status = "failed";
    } else {
      userMission.elapsedMinutes = Math.min(userMission.targetMinutes, userMission.elapsedMinutes + 30);
      if (userMission.elapsedMinutes >= userMission.targetMinutes) userMission.status = "success";
    }
  }

  renderAirconState();
  if (!currentUser || !supabaseClient) return;

  try {
    await persistAirconState();
    if (userMission.id) {
      const { error: missionError } = await supabaseClient
        .from("user_missions")
        .update({ status: userMission.status, elapsed_minutes: userMission.elapsedMinutes })
        .eq("id", userMission.id);
      if (missionError) throw missionError;

      if (userMission.status === "success" && !userMission.rewardGranted) {
        const { data: rewardPoints, error: rewardError } = await supabaseClient
          .rpc("complete_green_mission", { p_user_mission_id: userMission.id });
        if (rewardError) throw rewardError;
        userMission.rewardGranted = true;
        await loadPointData();
        renderUser();
        showToast(`미션 성공! GREEN POINT ${rewardPoints}P가 적립됐어요.`);
      }
    }
  } catch (error) {
    showToast(`진행 상태를 저장하지 못했어요: ${error.message}`);
  }
}

// 전원 버튼은 서버 호출 없이 현재 브라우저 메모리의 가상 상태만 변경합니다.
airconElements.powerToggle.addEventListener("click", () => {
  airconState.power = !airconState.power;
  renderAirconState();
  persistAirconState().catch((error) => showToast(`상태 저장 실패: ${error.message}`));
});

// 설정 온도는 실제 에어컨에서 일반적으로 사용하는 18~30℃ 범위로 제한합니다.
document.querySelector("#temperature-down").addEventListener("click", () => {
  airconState.temperature = Math.max(18, airconState.temperature - 1);
  renderAirconState();
  persistAirconState().catch((error) => showToast(`상태 저장 실패: ${error.message}`));
});

document.querySelector("#temperature-up").addEventListener("click", () => {
  airconState.temperature = Math.min(30, airconState.temperature + 1);
  renderAirconState();
  persistAirconState().catch((error) => showToast(`상태 저장 실패: ${error.message}`));
});

// 바람 세기 버튼을 누를 때마다 정해진 순서대로 다음 단계로 이동합니다.
const fanSteps = ["자동", "약풍", "중풍", "강풍"];
airconElements.fanControl.addEventListener("click", () => {
  const currentIndex = fanSteps.indexOf(airconState.fan);
  airconState.fan = fanSteps[(currentIndex + 1) % fanSteps.length];
  renderAirconState();
  persistAirconState().catch((error) => showToast(`상태 저장 실패: ${error.message}`));
});

document.querySelector("#usage-control").addEventListener("click", () => {
  simulateThirtyMinutes();
});

// 정상·필터 점검·센서 오류 시나리오는 서로 하나만 선택되도록 처리합니다.
document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => {
    const scenario = button.dataset.scenario;
    airconState.filter = scenario === "filter" ? "check" : "clean";
    airconState.sensor = scenario === "sensor" ? "error" : "normal";

    document.querySelectorAll("[data-scenario]").forEach((scenarioButton) => {
      scenarioButton.classList.toggle("is-selected", scenarioButton === button);
    });

    renderAirconState();
    persistAirconState().catch((error) => showToast(`상태 저장 실패: ${error.message}`));
  });
});

missionElements.start.addEventListener("click", async () => {
  if (!currentUser || !supabaseClient) {
    showView("my");
    showToast("로그인 후 GREEN MISSION에 참여할 수 있어요.");
    return;
  }

  if (userMission.status === "failed") {
    userMission.status = "available";
    userMission.elapsedMinutes = 0;
  }

  if (!areMissionConditionsValid()) {
    renderMissionState();
    return;
  }

  userMission.status = "active";
  userMission.elapsedMinutes = 0;
  renderMissionState();

  try {
    if (userMission.id) {
      const { error } = await supabaseClient
        .from("user_missions")
        .update({ status: "active", elapsed_minutes: 0, reward_granted: false, completed_at: null })
        .eq("id", userMission.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabaseClient
        .from("user_missions")
        .insert({ user_id: currentUser.id, mission_id: userMission.missionId, status: "active", elapsed_minutes: 0 })
        .select("id")
        .single();
      if (error) throw error;
      userMission.id = data.id;
    }
  } catch (error) {
    userMission.status = "available";
    renderMissionState();
    showToast(`미션을 시작하지 못했어요: ${error.message}`);
  }
});

missionElements.time.addEventListener("click", simulateThirtyMinutes);

walletElements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    pointWallet.filter = button.dataset.pointFilter;
    renderWallet();
  });
});

shopElements.categories.forEach((button) => {
  button.addEventListener("click", () => {
    rewardShop.category = button.dataset.rewardCategory;
    renderRewards();
  });
});

document.querySelectorAll("[data-close-reward]").forEach((button) => {
  button.addEventListener("click", closeRewardDetail);
});

shopElements.purchase.addEventListener("click", purchaseSelectedReward);

authElements.tabs.forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});
authElements.form.addEventListener("submit", submitAuthForm);
authElements.logout.addEventListener("click", signOut);

// 모든 화면 이동 버튼은 data-nav-target 값만 바꾸면 같은 방식으로 동작합니다.
navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.navTarget);
  });
});

document.querySelectorAll("[data-toast]").forEach((button) => {
  button.addEventListener("click", () => {
    showToast(button.dataset.toast);
  });
});

// 한국 시간 기준 날짜를 표시해 홈 화면이 조금 더 살아 있는 느낌을 줍니다.
const formattedToday = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Seoul",
}).format(new Date());

todayLabel.textContent = `${formattedToday} · 오늘도 시원하고 가볍게`;

// 새로고침해도 URL 해시와 같은 화면을 열되, 알 수 없는 주소는 홈으로 처리합니다.
const initialView = window.location.hash.replace("#", "") || "home";
showView(initialView);
renderAirconState();
renderWallet();
renderRewards();
renderOrders();
setAuthMode("login");
renderUser();
initializeAuth().catch((error) => {
  showAuthMessage(`초기 데이터를 불러오지 못했습니다: ${error.message}`, true);
});
