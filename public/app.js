const URL_BASE = 'http://localhost:3000/api';

const categoriesGrid = document.getElementById("categories-grid");
const productsGrid = document.getElementById("products-grid");

const viewAuth = document.getElementById("view-auth");
const viewCategories = document.getElementById("view-categories");
const viewProducts = document.getElementById("view-products");
const viewAdmin = document.getElementById("view-admin");

const userNameDisp = document.getElementById("userNameDisp");
const userRoleDisp = document.getElementById("userRoleDisp");

const currentCategoryTitle = document.getElementById("currentCategoryTitle");


function showAuth(type) {
    document.getElementById('loginForm').classList.toggle('active', type === 'login');
    document.getElementById('registerForm').classList.toggle('active', type === 'register');
    document.getElementById('tab-login').classList.toggle('active', type === 'login');
    document.getElementById('tab-register').classList.toggle('active', type === 'register');
}


document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
        nombre: regNombre.value,
        apellido: regApellido.value,
        username: regUsername.value,
        email: regEmail.value,
        password: regPassword.value
    };

    const res = await fetch(`${URL_BASE}/users/register`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
        showToast("Registro exitoso");
        showAuth('login');
        e.target.reset();
    } else {
        showToast(result.message || "Error al registrar");
    }
});

document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
        identifier: logIdentifier.value,
        password: logPassword.value
    };

    const res = await fetch(`${URL_BASE}/users/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
        localStorage.setItem('token', result.Token);
        localStorage.setItem('user', JSON.stringify(result.usuario));
        initApp();
    } else {
        showToast(result.message || "Login incorrecto");
    }
});


function initApp() {
    const userraw = localStorage.getItem('user');
    if (!userraw || userraw === "undefined") {
        viewAuth.style.setProperty = 'block';
        viewCategories.style.display = 'none';
        viewProducts.style.display = 'none';
        viewAdmin.style.display = 'none';
        return;
    }
    const user = JSON.parse(userraw);

    viewAuth.style.display = ('display', 'none', 'important');

    userNameDisp.textContent = user.nombre;
    userRoleDisp.textContent = "";

    checkAdminButton();

    if (user.role === 'admin') {
        showAdminView();
    } else {
        showCategoriesView();
    }
};

function showCategoriesView() {
    viewAuth.style.display = 'none';
    viewCategories.style.display = 'block';
    viewProducts.style.display = 'none';
    viewAdmin.style.display = 'none';
    checkAdminButton();
    loadCategories();
};

function showAdminView() {
    viewAuth.style.display = 'none';
    viewAdmin.style.display = 'block';
    viewCategories.style.display = 'none';
    viewProducts.style.display = 'none';
    loadAdminData();
    updateCategorySelect();
};


async function loadCategories() {
    try {
        const res = await fetch(`${URL_BASE}/category/viewCategorys`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
        });

        const categories = await res.json();
        categoriesGrid.innerHTML = "";

        categories.forEach(cat => {
        categoriesGrid.innerHTML += `
            <div class="category-item" onclick="openCategory('${cat._id}','${cat.nombre}')">
                <span class="category-link">${cat.nombre}</span>
            </div>
        `;
        });
    } catch (err) {
        console.error("Error cargando categorías", err);
    }
};

function openCategory(id, nombre) {
    loadProducts(id, nombre);
};

async function loadProducts(catId, nombre) {
    const res = await fetch(`${URL_BASE}/products/viewProducts?categoria=${catId}`, {method:'POST'});
    const products = await res.json();

    currentCategoryTitle.textContent = nombre;
    productsGrid.innerHTML = "";

    products.forEach(p => {
        const foto = p.imagen ? `http://localhost:3000/uploads/${p.imagen}` : '/uploads/default.avif';
        
        productsGrid.innerHTML += `
        <div class="card">
            <img src="${foto}" alt="${p.nombre}">
            <div class="card-content">
                <h3>${p.nombre}</h3>
                <p class="price">$${p.precio.toFixed(2)}</p>
                <p class="description">${p.descripcion || 'Producto de alta calidad para tu gatito.'}</p>
            </div>
            <div class="card-actions">
                <button class="btn-buy" onclick="alert('Próximamente: Carrito de compras')">Agregar al Carrito</button>
            </div>
        </div>
        `;
    });
    viewCategories.style.display = 'none';
    viewProducts.style.display = 'block';
};



async function updateCategorySelect() {
    const res = await fetch(`${URL_BASE}/category/viewCategorys`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const cats = await res.json();
    prodCategory.innerHTML =
        '<option value="">Seleccionar...</option>' +
        cats.map(c => `<option value="${c._id}">${c.nombre}</option>`).join('');
};

async function loadAdminData() {
    const cat = await fetch(`${URL_BASE}/category/viewCategorys`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json());

    document.getElementById("admin-list-categories").innerHTML =
        cat.map(c => `
        <div class="list-item">
            <span>${c.nombre}</span>
            <button class="btn-edit" onclick="editCategory('${c._id}','${c.nombre}')">Editar</button>
            <button class="btn-delete" onclick="deleteCategory('${c._id}')">Eliminar</button>
        </div>
        `).join('');

    const prod = await fetch(`${URL_BASE}/products/viewProducts`, {method: 'POST'}).then(r => r.json());

    document.getElementById("admin-list-products").innerHTML =
        prod.map(p => {
        const fotoCargada = p.imagen ? p.imagen : 'default.avif';
        return `<div class="list-item">
            <img src="http://localhost:3000/uploads/${fotoCargada}" width="50" style="border-radius:5px">
            <span>${p.nombre} ($${p.precio})</span>
            <button class="btn-edit" onclick="editProduct('${p._id}','${p.nombre}',${p.precio}, '${p.descripcion || ""}')">Editar</button>
            <button class="btn-delete" onclick="deleteProduct('${p._id}')">Eliminar</button>
        </div>
        `}).join('');

    const users = await fetch(`${URL_BASE}/users/Users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json());

    document.getElementById("admin-list-users").innerHTML =
        users.map(u => `
        <div class="list-item">
            <span>${u.username} (${u.role})</span>
            <button class="btn-delete" onclick="deleteUser('${u._id}')">Eliminar</button>
        </div>
        `).join('');
};

document.getElementById('createCategoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { nombre: document.getElementById('catNombre').value };
    
    const res = await fetch(`${URL_BASE}/category/createCategory`, { 
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        showToast("Categoría creada");
        e.target.reset();
        loadAdminData();
    }
});

async function deleteCategory(id) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    
    await fetch(`${URL_BASE}/category/deleteCategory/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadAdminData();
};

async function editCategory(id, nombreActual) {
    const nuevoNombre = prompt("Nuevo nombre para la categoría:", nombreActual);
    if (!nuevoNombre) return;

    await fetch(`${URL_BASE}/category/updateCategory/${id}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ nombre: nuevoNombre })
    });
    loadAdminData();
};


document.getElementById('createProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', document.getElementById('prodNombre').value);
    formData.append('precio', document.getElementById('prodPrecio').value);
    formData.append('descripcion', document.getElementById('prodDescripcion').value);
    formData.append('categoria', document.getElementById('prodCategory').value);

    const fileInput = document.getElementById('prodImagen');
    if (fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]); 
    }

    await fetch(`${URL_BASE}/products/createProduct`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: formData
    });

    showToast("Producto agregado");
    e.target.reset();
    loadAdminData();
});

async function editProduct(id, nombreActual, precioActual, descActual) {
    const nuevoNombre = prompt("Nuevo nombre:", nombreActual) || nombreActual;
    const nuevoPrecio = prompt("Nuevo precio:", precioActual) || precioActual;
    const nuevaDesc = prompt("Nueva descripción:", descActual) || descActual;
    const formData = new FormData();
    formData.append('nombre', nuevoNombre);
    formData.append('precio', nuevoPrecio);
    formData.append('descripcion', nuevaDesc);
    if (confirm("¿Quieres cambiar la imagen también?")) {
        const fileInput = document.getElementById('edit-prod-file');
        fileInput.onchange = null; 
        fileInput.onchange = async () => {
            if (fileInput.files[0]) {
                formData.append('imagen', fileInput.files[0]);
                await enviarEdicion(id, formData);
            }
        };
        fileInput.click();
    } else {
        await enviarEdicion(id, formData);
    }
};

async function enviarEdicion(id, formData) {
    const res = await fetch(`${URL_BASE}/products/updateProduct/${id}`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });

    if (res.ok) {
        showToast("¡Producto actualizado!");
        loadAdminData(); 
    } else {
        showToast("Error al actualizar");
    }
};

async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto?")) return;
    const res = await fetch(`${URL_BASE}/products/deleteProduct/${id}`, {
        method: 'POST', // Tu servidor usa POST para borrar
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.ok) {
        loadAdminData();
    } else {
        showToast("No se pudo eliminar");
    }
};

// --- USUARIOS ---
async function deleteUser(id) {
    if (!confirm("¿Eliminar este usuario?")) return;
    await fetch(`${URL_BASE}/users/deleteUser/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadAdminData();
};



function logout() {
    localStorage.clear();
    location.reload();
};

function showToast(msg) {
    alert(msg);
};

const addCatForm = document.getElementById('addCategoryForm');
if (addCatForm) {
    addCatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { 
            nombre: document.getElementById('catNombre').value,
            descripcion: document.getElementById('catDescripcion').value 
        };
        
        const res = await fetch(`${URL_BASE}/category/addCategory`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast("Categoría creada con éxito");
            addCatForm.reset();
            loadAdminData(); 
        }
    });
};

const addProdForm = document.getElementById('addProductForm');
if (addProdForm) {
    addProdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('prodNombre').value,
            precio: document.getElementById('prodPrecio').value,
            descripcion: document.getElementById('prodDescripcion').value, 
            categoria: document.getElementById('prodCategory').value
        };

        const res = await fetch(`${URL_BASE}/products/addProduct`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast("Producto guardado");
            addProdForm.reset();
            loadAdminData();
        }
    });
};

function checkAdminButton() {
    const userraw = localStorage.getItem('user');
    const btnAdmin = document.getElementById('btn-regresar-admin');
    
    if (!btnAdmin) return;
    let isAdmin = false;
    if (userraw && userraw !== "undefined") {
        const user = JSON.parse(userraw);
        if (user.role === 'admin') {
            isAdmin = true;
        }
    }

    if (isAdmin) {
        btnAdmin.style.display = 'inline-block';
    } else {
        btnAdmin.style.display = 'none';
    }
}


initApp();

