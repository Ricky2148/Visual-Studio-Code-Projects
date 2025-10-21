// Initialize Supabase client
const SUPABASE_URL = "https://xsojagtjwixhootxafyr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzb2phZ3Rqd2l4aG9vdHhhZnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDc2OTEsImV4cCI6MjA3NjM4MzY5MX0.Vg-cAPZ63r5dWPrz9dTA-QpGvIAfJu1YeriXJAH_FUo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Switch dashboard sections
function showSection(sectionId) {
  const sections = document.querySelectorAll(".page-section");
  sections.forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");

  if (sectionId === "profile") loadProfile();
}

// --- SIGN UP ---
async function handleSignUp() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) alert("Sign-up failed: " + error.message);
  else {
    alert("Account created successfully!");
    window.location.href = "dashboard.html";
  }
}

// --- LOGIN ---
async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) alert("Login failed: " + error.message);
  else window.location.href = "dashboard.html";
}

// --- LOGOUT ---
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// --- LOAD CONCERTS FROM SUPABASE ---
async function loadConcerts() {
  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error loading concerts:", error);
    return;
  }

  const concertList = document.getElementById("concertList");
  concertList.innerHTML = "";

  data.forEach(concert => {
    const div = document.createElement("div");
    div.classList.add("concert-card");
    div.innerHTML = `
      <h3>${concert.artist}</h3>
      <p>${concert.location} — ${concert.date}</p>
      <button onclick="addToFavorites(${concert.id}, '${concert.artist}', '${concert.location} — ${concert.date}')">
        ⭐ Add to Favorites
      </button>
    `;
    concertList.appendChild(div);
  });
}

// --- ADD TO FAVORITES (PREVENT DUPLICATES) ---
async function addToFavorites(concertId, artist, details) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    alert("Please log in first.");
    return;
  }

  // Check if already favorited
  const { data: existing, error: checkError } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .eq("concert_id", concertId);

  if (checkError) {
    alert("Error checking favorites: " + checkError.message);
    return;
  }

  if (existing.length > 0) {
    alert(`${artist} is already in your favorites.`);
    return;
  }

  // Insert new favorite
  const { error } = await supabase
    .from("favorites")
    .insert([{ user_id: user.id, concert_id: concertId }]);

  if (error) alert("Error adding favorite: " + error.message);
  else {
    alert(`${artist} added to your favorites!`);
    await loadFavorites();
  }
}

// --- LOAD FAVORITES FROM SUPABASE ---
async function loadFavorites() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const { data, error } = await supabase
    .from("favorites")
    .select("concerts(artist, location, date)")
    .eq("user_id", user.id);

  const favDiv = document.getElementById("favoritesList");
  favDiv.innerHTML = "";

  if (error || !data.length) {
    favDiv.innerHTML = "<p>No favorites yet.</p>";
    return;
  }

  data.forEach(fav => {
    const c = fav.concerts;
    const div = document.createElement("div");
    div.classList.add("concert-card");
    div.innerHTML = `<strong>${c.artist}</strong> — ${c.location} (${c.date})`;
    favDiv.appendChild(div);
  });
}

// --- LOAD PROFILE DATA ---
async function loadProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const { data, error } = await supabase
    .from("users")
    .select("full_name, favorite_artists, favorite_genre, city")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
    return;
  }

  document.getElementById("profileName").value = data?.full_name || "";
  document.getElementById("favoriteArtists").value = data?.favorite_artists || "";
  document.getElementById("favoriteGenre").value = data?.favorite_genre || "";
  document.getElementById("profileCity").value = data?.city || "";
}

// --- UPDATE PROFILE DATA ---
async function updateProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const updates = {
    id: user.id,
    full_name: document.getElementById("profileName").value,
    favorite_artists: document.getElementById("favoriteArtists").value,
    favorite_genre: document.getElementById("favoriteGenre").value,
    city: document.getElementById("profileCity").value,
  };

  const { error } = await supabase.from("users").upsert(updates);

  const status = document.getElementById("profileStatus");
  if (error) {
    status.textContent = "Error saving profile.";
    status.style.color = "red";
  } else {
    status.textContent = "Profile updated successfully!";
    status.style.color = "green";
  }
}

// --- AUTO LOAD ON DASHBOARD ---
if (window.location.pathname.endsWith("dashboard.html")) {
  (async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    await loadConcerts();
    await loadFavorites();
  })();
}
