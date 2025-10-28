// ====== Supabase init ======
const SUPABASE_URL = "https://nshivifdkkovjpbfqlex.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGl2aWZka2tvdmpwYmZxbGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDQ2MDQsImV4cCI6MjA3NjM4MDYwNH0.GoLV4wfw7XUUc1zWW46VYXQFwlW3Op-uaCykDN7NxrE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ====== Section switching ======
function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");

  if (sectionId === "profile") loadProfile();
  if (sectionId === "favorites") loadFavorites();
}

// ====== Auth ======
async function handleSignUp() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return alert("Sign-up failed: " + error.message);
  alert("Account created successfully!");
  window.location.href = "dashboard.html";
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("Login failed: " + error.message);
  window.location.href = "dashboard.html";
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// ====== Concerts (unchanged structure) ======
async function loadConcerts() {
  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .order("date", { ascending: true });

  if (error) { console.error("Error loading concerts:", error); return; }

  const concertList = document.getElementById("concertList");
  concertList.innerHTML = "";

  data.forEach(concert => {
    const div = document.createElement("div");
    div.classList.add("concert-card");
    div.innerHTML = `
      <h3>${concert.artist}</h3>
      <p>${concert.location} — ${concert.date}</p>
      <button onclick="addToFavorites(${concert.id}, '${concert.artist.replace(/'/g,"\\'")}')">
        ⭐ Add to Favorites
      </button>
    `;
    concertList.appendChild(div);
  });
}

// Prevent duplicate favorites for a user
async function addToFavorites(concertId, artist) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return alert("Please log in first.");

  const { data: existing, error: checkError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("concert_id", concertId);

  if (checkError) return alert("Error checking favorites: " + checkError.message);
  if (existing && existing.length > 0) return alert(`${artist} is already in your favorites.`);

  const { error } = await supabase
    .from("favorites")
    .insert([{ user_id: user.id, concert_id: concertId }]);

  if (error) return alert("Error adding favorite: " + error.message);
  await loadFavorites();
  alert(`${artist} added to your favorites!`);
}

// ====== Favorites (render original line + small button on right) ======
async function loadFavorites() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const { data, error } = await supabase
    .from("favorites")
    .select("id, concerts(artist, location, date)")
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  const favDiv = document.getElementById("favoritesList");
  favDiv.innerHTML = "";

  if (error) {
    favDiv.innerHTML = `<p>Error loading favorites: ${error.message}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    favDiv.innerHTML = "<p>No favorites yet.</p>";
    return;
  }

  data.forEach(fav => {
    const c = fav.concerts;
    const div = document.createElement("div");
    div.classList.add("concert-card");
    // Original single-line format:
    div.innerHTML = `
      <span><strong>${c.artist}</strong> — ${c.location} (${c.date})</span>
      <button class="remove-btn" onclick="removeFavorite('${fav.id}')">× Remove</button>
    `;
    favDiv.appendChild(div);
  });
}

async function removeFavorite(favoriteId) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return alert("Please log in first.");

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", user.id);

  if (error) return alert("Error removing favorite: " + error.message);
  await loadFavorites();
}

// ====== Profile ======
async function loadProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user; if (!user) return;

  const { data, error } = await supabase
    .from("users")
    .select("full_name, favorite_artists, favorite_genre, city")
    .eq("id", user.id)
    .single();

  if (error) { console.error("Error loading profile:", error); return; }

  document.getElementById("profileName").value = data?.full_name || "";
  document.getElementById("favoriteArtists").value = data?.favorite_artists || "";
  document.getElementById("favoriteGenre").value = data?.favorite_genre || "";
  document.getElementById("profileCity").value = data?.city || "";
}

async function updateProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user; if (!user) return;

  const updates = {
    id: user.id,
    full_name: document.getElementById("profileName").value,
    favorite_artists: document.getElementById("favoriteArtists").value,
    favorite_genre: document.getElementById("favoriteGenre").value,
    city: document.getElementById("profileCity").value,
  };

  const { error } = await supabase.from("users").upsert(updates);
  const status = document.getElementById("profileStatus");
  if (error) { status.textContent = "Error saving profile."; status.style.color = "red"; }
  else { status.textContent = "Profile updated successfully!"; status.style.color = "green"; }
}

// ====== Auto-init on dashboard ======
if (window.location.pathname.endsWith("dashboard.html")) {
  (async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { window.location.href = "index.html"; return; }
    await loadConcerts();
    await loadFavorites();
  })();
}
