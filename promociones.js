// promociones.js
// Maneja el carrito y aplica las tres promociones descritas.
// Archivo separado para mantener la lógica de la página de promociones fuera del HTML.
// Contiene:
// - Datos de productos (demo estática)
// - Funciones para manejar el carrito (agregar, remover, render)
// - Cálculo de 3 promociones:
//    A: Llevá 2 y obtené 50% en el segundo (por pares de la misma unidad)
//    B: 3x2 en productos seleccionados (se marca con promo3x2 = true)
//    C: 10% sobre total si total sin descuento > $30.000
// - Modo de aplicación: 'best' (mejor promoción) o 'manual'

// Lista de productos de ejemplo. En un proyecto real esto vendría del backend o un JSON.
const products = [
    { id: 'spiderman-comic', name: 'Spider-Man #1', price: 12000, promo3x2: false },
    { id: 'ironman-comic', name: 'Iron Man: Extremis', price: 15000, promo3x2: false },
    { id: 'xmen-comic', name: 'X-Men: Days of Future Past', price: 10000, promo3x2: true },
    { id: 'batman-comic', name: 'Batman: Año Uno', price: 14000, promo3x2: false },
    { id: 'taza-spiderman', name: 'Taza Spider-Man', price: 4000, promo3x2: true },
    { id: 'taza-batman', name: 'Taza Batman', price: 4000, promo3x2: true }
];

// Estado local del carrito. Cada entrada: { id, name, price, qty, promo3x2 }
let cart = [];

// Inicializa el selector de productos en el formulario.
// Agrega opciones <option> con el formato: "Nombre - $precio"
function initProductSelect() {
    const sel = document.getElementById('product-select');
    products.forEach(product => {
        const opt = document.createElement('option');
        opt.value = product.id; // identifica el producto
        opt.textContent = `${product.name} - $${product.price.toLocaleString('es-AR')}`;
        sel.appendChild(opt);
    });
}

// Renderiza el contenido actual del carrito en la tabla HTML.
// Usa el array `cart` (cada elemento tiene { id, name, price, qty, promo3x2 }).
function renderCart() {
    const tbody = document.querySelector('#cart-table tbody');
    tbody.innerHTML = '';
    cart.forEach((cartItem, rowIndex) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cartItem.name}</td>
            <td>$${cartItem.price.toLocaleString('es-AR')}</td>
            <td>${cartItem.qty}</td>
            <td>$${(cartItem.price * cartItem.qty).toLocaleString('es-AR')}</td>
            <td><button class="btn btn-sm btn-outline-danger" data-row-index="${rowIndex}">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
    // Añade los listeners para eliminar filas (data-row-index)
    document.querySelectorAll('#cart-table button').forEach(btn => {
        btn.addEventListener('click', e => {
            const rowIndex = Number(e.target.dataset.rowIndex);
            cart.splice(rowIndex, 1);
            renderCart();
            calculateAndRender();
        });
    });
}

function addToCart() {
    const sel = document.getElementById('product-select');
    const qtyInput = document.getElementById('qty-input');
    const productId = sel.value;
    // Tomamos la cantidad solicitada y la normalizamos a entero >=1
    let qty = Math.max(1, Math.floor(Number(qtyInput.value) || 1));
    // Buscar el producto por su id en la lista `products`
    const product = products.find(prod => prod.id === productId);
    if (!product) return;
    const existing = cart.find(c => c.id === product.id);
    const MAX_PER_PRODUCT = 5; // límite por requerimiento
    const feedback = document.getElementById('qty-feedback');
    if (existing) {
        const newQty = Math.min(MAX_PER_PRODUCT, existing.qty + qty);
        if (newQty !== existing.qty + qty) {
            // Si se supera el máximo, mostrar warning message brevemente
            if (feedback) {
                feedback.style.display = 'block';
                setTimeout(() => feedback.style.display = 'none', 2500);
            }
        }
        existing.qty = newQty;
    } else {
        const finalQty = Math.min(MAX_PER_PRODUCT, qty);
        if (finalQty !== qty) {
            if (feedback) {
                feedback.style.display = 'block';
                setTimeout(() => feedback.style.display = 'none', 2500);
            }
        }
        cart.push({ id: product.id, name: product.name, price: product.price, qty: finalQty, promo3x2: product.promo3x2 });
    }
    renderCart();
    calculateAndRender();
}

// Promociones:
// A: Llevá 2 y 50% en el segundo (por pares de la misma unidad)
// B: 3x2 en productos seleccionados (promo3x2 true)
// C: 10% si total sin descuento > 30000

// Promo A: "Llevá 2 y obtené 50% en el segundo"
// Por cada par de unidades del mismo producto, el segundo tiene 50% de descuento.
// Ej: qty = 3 -> aplica para 1 par (descuento = 0.5 * price)
function calcPromoA(cartCopy) {
    // devuelve objeto { discount, message }
    let discount = 0;
    cartCopy.forEach(item => {
        const pares = Math.floor(item.qty / 2);
        discount += pares * (item.price * 0.5);
    });
    return { id: 'promoA', discount: Math.round(discount), message: 'Llevá 2 y 50% en el segundo aplicado donde corresponde.' };
}

// Promo B: "3x2 en productos seleccionados"
// Solo aplica si el producto tiene promo3x2 = true. Por cada 3 unidades, el descuento equivale a 1 unidad.
function calcPromoB(cartCopy) {
    let discount = 0;
    cartCopy.forEach(item => {
        if (item.promo3x2) {
            const grupos = Math.floor(item.qty / 3);
            // Por cada grupo de 3, el descuento es el precio de 1 unidad
            discount += grupos * item.price; // pagás 2 y obtenés 3 -> descuento = 1 unidad por cada 3
        }
    });
    return { id: 'promoB', discount: Math.round(discount), message: '3x2 aplicado en productos seleccionados.' };
}

// Promo C: 10% de descuento si el total sin descuentos supera $30.000
function calcPromoC(totalWithout) {
    if (totalWithout > 30000) {
        const d = Math.round(totalWithout * 0.10);
        return { id: 'promoC', discount: d, message: '10% de descuento por compras superiores a $30.000.' };
    }
    return { id: 'promoC', discount: 0, message: 'No aplica 10% (total menor o igual a $30.000).' };
}

function calculateAndRender() {
    const totalBefore = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const promoA = calcPromoA(cart);
    const promoB = calcPromoB(cart);
    const promoC = calcPromoC(totalBefore);

    // Actualizar panel comparativo
    const elA = document.getElementById('compare-promoA');
    const elB = document.getElementById('compare-promoB');
    const elC = document.getElementById('compare-promoC');
    if (elA) elA.textContent = `$${promoA.discount.toLocaleString('es-AR')}`;
    if (elB) elB.textContent = `$${promoB.discount.toLocaleString('es-AR')}`;
    if (elC) elC.textContent = `$${promoC.discount.toLocaleString('es-AR')}`;

    // Siempre aplicamos la mejor promoción disponible (la que genera mayor descuento)
    const arr = [promoA, promoB, promoC];
    const applied = arr.reduce((best, cur) => cur.discount > best.discount ? cur : best, { id: 'none', discount: 0 });

    // Resaltar en la comparativa cuál es la mejor
    const bestEl = document.getElementById('best-recommendation');
    if (bestEl) {
        if (applied && applied.discount > 0) {
            bestEl.textContent = `Recomendación: ${applied.message} Ahorro: $${applied.discount.toLocaleString('es-AR')}`;
        } else {
            bestEl.textContent = 'No aplica ninguna promoción que reduzca el total.';
        }
    }

    const totalFinal = Math.round(Math.max(0, totalBefore - applied.discount));

    document.getElementById('total-before').textContent = `Total sin descuento: $${totalBefore.toLocaleString('es-AR')}`;
    document.getElementById('discount-applied').textContent = `Descuento: $${applied.discount.toLocaleString('es-AR')}`;
    document.getElementById('total-final').textContent = `Total final: $${totalFinal.toLocaleString('es-AR')}`;
    document.getElementById('promo-message').textContent = applied.message || '';
}

function setupEventListeners() {
    document.getElementById('add-btn').addEventListener('click', addToCart);
    document.getElementById('add-form').addEventListener('submit', e => e.preventDefault());
    // No hay control de modo/manual: siempre aplicamos la mejor promoción.
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initProductSelect();
    setupEventListeners();
    renderCart();
    calculateAndRender();
});
