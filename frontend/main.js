let currentUser = null;

/**
 * Wyświetla komunikat w obszarze #message.
 * @param {string} text Treść komunikatu.
 * @param {string} type Typ komunikatu ('info', 'success', 'error').
 */
function showMessage(text, type = 'info') {
  const messageDiv = document.getElementById('message');
  messageDiv.innerText = text;
  messageDiv.className = type;
  setTimeout(() => {
    messageDiv.innerText = '';
    messageDiv.className = '';
  }, 5000);
}

/**
 * Wyświetla powiadomienie w obszarze #notification.
 * @param {string} text Treść powiadomienia.
 */
function showNotification(text) {
  const notifDiv = document.getElementById('notification');
  notifDiv.innerText = text;
  setTimeout(() => {
    notifDiv.innerText = '';
  }, 5000);
}

/**
 * Aktualizuje widoczność pozycji w menu oraz informację o zalogowanym użytkowniku.
 */
function renderNav() {
  if (currentUser) {
    document.getElementById('nav-profile').style.display = 'inline';
    document.getElementById('nav-cars').style.display = 'inline';
    document.getElementById('nav-buy').style.display = 'inline';
    if (currentUser.role === 'admin') {
      document.getElementById('nav-users').style.display = 'inline';
    }
    document.getElementById('nav-logout').style.display = 'inline';
    document.getElementById('nav-login').style.display = 'none';
    document.getElementById('nav-register').style.display = 'none';

    document.getElementById('user-info').innerText =
      `Zalogowany jako: ${currentUser.username} | Rola: ${currentUser.role} | Saldo: ${currentUser.balance}`;
  } else {
    document.getElementById('nav-profile').style.display = 'none';
    document.getElementById('nav-cars').style.display = 'none';
    document.getElementById('nav-buy').style.display = 'none';
    document.getElementById('nav-users').style.display = 'none';
    document.getElementById('nav-logout').style.display = 'none';
    document.getElementById('nav-login').style.display = 'inline';
    document.getElementById('nav-register').style.display = 'inline';

    document.getElementById('user-info').innerText = 'Nie jesteś zalogowany';
  }
}

/**
 * Sprawdza, czy użytkownik jest zalogowany poprzez wywołanie endpointu /users.
 * Dla zwykłych userów zwracany jest obiekt, a dla admina (ze względu na uprawnienia)
 * – tablica wszystkich użytkowników. W tym przypadku wybieramy obiekt admina.
 */
async function checkAuth() {
    try {
        const res = await fetch('http://localhost:3000/me', {
            method: 'POST',
            credentials: 'include' // Important: send cookies with request
        });
        if (res.status === 200) {
            const data = await res.json();
            currentUser = data;
        } else {
            currentUser = null;
        }
    } catch (err) {
        currentUser = null;
    }
    renderNav();
}

/**
 * Pokazuje wskazany widok (sekcję) i ukrywa pozostałe.
 * @param {string} viewId ID widoku do pokazania.
 */
function showView(viewId) {
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.style.display = 'none';
  });
  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.style.display = 'block';
  }
}

/**
 * Ładuje dane profilu aktualnie zalogowanego użytkownika.
 */
async function loadProfile() {
  try {
      if (!currentUser) return;
      const userId = currentUser.id;
      const res = await fetch(`http://localhost:3000/users/${userId}`, {
          credentials: 'include'
      });
    if (res.status === 200) {
      const data = await res.json();
      let profile;
      if (data) {
        profile = data;
      }
      if (profile) {
        document.getElementById('profile-info').innerText =
          `Username: ${profile.username}\nSaldo: ${profile.balance}`;
      }
    }
  } catch (err) {
    showMessage('Błąd przy pobieraniu profilu', 'error');
  }
}

/**
 * Ładuje listę samochodów i wyświetla je w sekcji #cars-list.
 */
async function loadCars() {
  try {
      const res = await fetch('http://localhost:3000/cars', {
          credentials: 'include'
      });
    if (res.status === 200) {
      const cars = await res.json();
      let html = '';
      if (cars.length === 0) {
        html = 'Brak samochodów.';
      } else {
        cars.forEach(car => {
          html += `<div class="car-item">
                     <strong>ID:</strong> ${car.id} |
                     <strong>Model:</strong> ${car.model} |
                     <strong>Cena:</strong> ${car.price} |
                     <strong>Właściciel:</strong> ${car.ownerId}
                   </div>`;
        });
      }
      document.getElementById('cars-list').innerHTML = html;
    }
  } catch (err) {
    showMessage('Błąd przy pobieraniu samochodów', 'error');
  }
}

/**
 * Ładuje listę uzytkownikow i wyświetla je w sekcji #users-list.
 */
async function loadUsers() {
    try {
        const res = await fetch('http://localhost:3000/users', {
            credentials: 'include'
        });
        if (res.status === 200) {
            const users = await res.json();
            let html = '';
            if (users.length === 0) {
                html = 'Brak użytkowników.';
            } else {
                users.forEach(user => {
                    html += `<div class="user-item">
                     <strong>ID:</strong> ${user.id} |
                     <strong>User:</strong> ${user.username} |
                     <strong>Password:</strong> ${user.password} |
                     <strong>Role:</strong> ${user.role}
                     <strong>Balance:</strong> ${user.balance}
                   </div>`;
                });
            }
            document.getElementById('users-list').innerHTML = html;
        }
    } catch (err) {
        showMessage('Błąd przy pobieraniu samochodów', 'error');
    }
}
/**
 * Ustawia wszystkie nasłuchiwacze zdarzeń dla formularzy oraz routingu.
 */
function setupEventListeners() {
  // Routing – zmiana widoku po zmianie fragmentu URL
  window.addEventListener('hashchange', route);
  route(); // inicjalizacja

  // Formularz logowania
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.status === 200) {
        showMessage('Zalogowano pomyślnie', 'success');
        await checkAuth();
        window.location.hash = '#home';
      } else {
        showMessage(data.error || 'Błąd logowania', 'error');
      }
    });
  }

  // Formularz rejestracji
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const password = document.getElementById('regPassword').value;
      const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.status === 201) {
        showMessage('Rejestracja powiodła się, możesz się zalogować', 'success');
        window.location.hash = '#login';
      } else {
        showMessage(data.error || 'Błąd rejestracji', 'error');
      }
    });
  }

  // Formularz aktualizacji profilu
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newUsername = document.getElementById('newUsername').value;
      const newPassword = document.getElementById('newPassword').value;
      const userId = currentUser.id;
      const res = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: newUsername, password: newPassword })
      });
      const data = await res.json();
      if (res.status === 200) {
        const userId = data.id;
        showMessage('Profil zaktualizowany', 'success');
        await checkAuth();
        await loadProfile(userId);
      } else {
        showMessage(data.error || 'Błąd aktualizacji profilu', 'error');
      }
    });
  }

  // Formularz dodawania samochodu
  const addCarForm = document.getElementById('addCarForm');
  if (addCarForm) {
    addCarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const model = document.getElementById('carModel').value;
      const price = parseFloat(document.getElementById('carPrice').value);
      const res = await fetch('http://localhost:3000/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({model, price})
      });
      const data = await res.json();
      if (res.status === 201) {
        showMessage('Samochód dodany', 'success');
        loadCars();
      } else {
        showMessage(data.error || 'Błąd dodawania samochodu', 'error');
      }
    });
  }

  // Formularz zakupu samochodu
  const buyCarForm = document.getElementById('buyCarForm');
  if (buyCarForm) {
    buyCarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = currentUser.id;
      const carId = document.getElementById('buyCarId').value;
      const res = await fetch(`http://localhost:3000/cars/${carId}/buy`, { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({buyerId: userId}),
      });
      const data = await res.json();
      if (res.status === 200) {
        showMessage('Samochód zakupiony', 'success');
        loadCars();
        await checkAuth(); // aktualizacja salda
      } else {
        showMessage(data.error || 'Błąd zakupu samochodu', 'error');
      }
    });
  }
}

    // Formularz usuwania użytkownika
    const deleteUserForm = document.getElementById('deleteUserForm');
    if (deleteUserForm) {
        deleteUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('deleteUserId').value;
            const res = await fetch(`http://localhost:3000/users/${userId}`, { method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await res.json();
            if (res.status === 200) {
                showMessage('Użytkownik usunięty', 'success');
                loadUsers();
            } else {
                showMessage(data.error || 'Błąd usunięcia użytkownika', 'error');
            }
        });
    }

    // Formularz edycji użytkownika
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:3000/users/${userId}`, { method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value,
                    role: document.getElementById('editRole').value,
                    balance: document.getElementById('balance').value,
                }),
            });
            const data = await res.json();
            if (res.status === 200) {
                showMessage('Edycja użytkownika poprawna', 'success');
                loadUsers();
            } else {
                showMessage(data.error || 'Błąd edycji użytkownika', 'error');
            }
        });
    }

    // Formularz dodawania użytkownika
    const addNewUserForm = document.getElementById('addNewUserForm');
    if (addNewUserForm) {
        addNewUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:3000/register`, { method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value,
                }),
            });
            const data = await res.json();
            if (res.status === 200) {
                showMessage('Użytkownik dodany', 'success');
                loadUsers();
            } else {
                showMessage(data.error || 'Błąd dodania użytkownika', 'error');
            }
        });
    }

/**
 * Prosty router – na podstawie fragmentu adresu URL (hash) wyświetla odpowiedni widok.
 * Specjalnie obsługujemy #logout, aby "wylogować" użytkownika (symulacja).
 */
function route() {
    const hash = window.location.hash || '#home';
    const viewId = hash.substring(1) + '-view';

    if (hash === '#logout') {
        // Secure logout - call server endpoint
        fetch('http://localhost:3000/logout', {
            method: 'POST',
            credentials: 'include' // Important: send cookie to be cleared
        }).then(async (res) => {
            if (res.status === 200) {
                currentUser = null;
                renderNav();
                showMessage('Wylogowano pomyślnie', 'success');
                window.location.hash = '#home';
            } else {
                showMessage('Błąd wylogowania', 'error');
            }
        }).catch((err) => {
            console.error('Logout error:', err);
            showMessage('Błąd wylogowania', 'error');
        });
        return;
    }

    showView(viewId);
    if (viewId === 'profile-view') {
        loadProfile();
    }
    if (viewId === 'cars-view') {
        loadCars();
    }
    if (viewId === 'users-view') {
        loadUsers();
    }
}

/**
 * Ustawia nasłuchiwanie Server-Sent Events, które wyświetlają powiadomienia o zdarzeniach (np. zakupie samochodu).
 */
function setupSSE() {
  const evtSource = new EventSource('/sse');
  evtSource.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    showNotification(`SSE: ${msg.event} - Car ID: ${msg.id}, Buyer ID: ${msg.buyerId}`);
  };
}

window.addEventListener('load', async () => {
  await checkAuth();
  setupEventListeners();
  setupSSE();
});
