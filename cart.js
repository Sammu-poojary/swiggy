/**
 * FoodCart Shared Cart Logic
 * Manages cart state in localStorage, dynamically injects Offcanvas UI,
 * and handles events for Add to Cart and Buy Now options globally.
 */

const cartKey = 'foodcart-global-cart';

// Helper to get page slug
function getPageSlug() {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    if (nameParam) {
        return nameParam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    return pageName || 'index';
}

// Load cart from localStorage
function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch {
        return [];
    }
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartCount();
}

// Show global toast message
function showGlobalToast(message) {
    let toastBox = document.getElementById('globalToastBox');
    if (!toastBox) {
        toastBox = document.createElement('div');
        toastBox.id = 'globalToastBox';
        toastBox.className = 'global-toast-box';
        document.body.appendChild(toastBox);
    }
    toastBox.textContent = message;
    toastBox.classList.add('show');
    clearTimeout(window.globalToastTimer);
    window.globalToastTimer = setTimeout(() => {
        toastBox.classList.remove('show');
    }, 1800);
}

// Inject Offcanvas and Toast into DOM
function injectCartDOM() {
    // Check if offcanvas already exists
    if (document.getElementById('globalCartOffcanvas')) return;

    const offcanvasHTML = `
    <div class="offcanvas offcanvas-end" tabindex="-1" id="globalCartOffcanvas" aria-labelledby="globalCartOffcanvasLabel" style="width: 400px; z-index: 1080;">
        <div class="offcanvas-header border-bottom">
            <h5 class="offcanvas-title fw-bold" id="globalCartOffcanvasLabel">
                <i class="bi bi-cart-fill me-2 text-warning"></i>Your Cart
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column justify-content-between">
            <!-- Cart Items -->
            <div id="globalCartItems" class="flex-grow-1 overflow-y-auto mb-3" style="max-height: 40vh;">
                <!-- Rendered items go here -->
            </div>

            <!-- Summary & Payment Panel -->
            <div class="border-top pt-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="fw-semibold text-muted fs-6">Subtotal:</span>
                    <span class="fw-bold fs-4 text-dark" id="globalCartSubtotal">₹0</span>
                </div>

                <!-- Payment Option Section -->
                <div id="globalPaymentSection" class="p-3 bg-light rounded-3 mb-3" style="display: none;">
                    <h6 class="fw-bold mb-3"><i class="bi bi-wallet2 me-2 text-warning"></i>Payment Option</h6>
                    <label class="global-payment-option w-100">
                        <input type="radio" name="globalPaymentMethod" value="upi" checked>
                        <span><i class="bi bi-qr-code me-2"></i>UPI / QR Code</span>
                    </label>
                    <label class="global-payment-option w-100">
                        <input type="radio" name="globalPaymentMethod" value="card">
                        <span><i class="bi bi-credit-card me-2"></i>Debit / Credit Card</span>
                    </label>
                    <label class="global-payment-option w-100 mb-0">
                        <input type="radio" name="globalPaymentMethod" value="cod">
                        <span><i class="bi bi-cash me-2"></i>Cash on Delivery</span>
                    </label>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex gap-2">
                    <button class="btn btn-warning flex-grow-1 rounded-pill fw-bold py-2" id="globalPayNowBtn" style="display: none;">Pay Now</button>
                    <button class="btn btn-outline-secondary rounded-pill px-3" id="globalClearCartBtn" title="Clear Cart">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    const div = document.createElement('div');
    div.innerHTML = offcanvasHTML.trim();
    document.body.appendChild(div.firstChild);

    // Create Toast box if missing
    if (!document.getElementById('globalToastBox')) {
        const toastBox = document.createElement('div');
        toastBox.id = 'globalToastBox';
        toastBox.className = 'global-toast-box';
        document.body.appendChild(toastBox);
    }
}

// Render cart items inside Offcanvas
function renderCart() {
    const cart = loadCart();
    const itemsContainer = document.getElementById('globalCartItems');
    const subtotalText = document.getElementById('globalCartSubtotal');
    const paymentSection = document.getElementById('globalPaymentSection');
    const payNowBtn = document.getElementById('globalPayNowBtn');

    if (!itemsContainer || !subtotalText) return;

    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    subtotalText.textContent = `₹${subtotal}`;

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-cart-x fs-1 mb-2 d-block"></i>
                Your cart is empty.
            </div>`;
        paymentSection.style.display = 'none';
        payNowBtn.style.display = 'none';
        return;
    }

    // Render list
    itemsContainer.innerHTML = cart.map((item, index) => `
        <div class="offcanvas-cart-item">
            <div>
                <div class="fw-bold text-dark">${item.name}</div>
                <small class="text-muted">Qty: ${item.quantity}</small>
            </div>
            <div class="text-end">
                <div class="fw-bold text-dark">₹${item.price * item.quantity}</div>
                <button class="btn btn-link text-danger p-0 fs-7 remove-global-cart-item" data-index="${index}" style="font-size: 0.85rem; text-decoration: none;">
                    Remove
                </button>
            </div>
        </div>
    `).join('');

    // Show payments and button
    paymentSection.style.display = 'block';
    payNowBtn.style.display = 'block';

    // Hook remove buttons
    document.querySelectorAll('.remove-global-cart-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            const cartToUpdate = loadCart();
            cartToUpdate.splice(index, 1);
            saveCart(cartToUpdate);
            renderCart();
        });
    });
}

// Update badges/counts in headers
function updateCartCount() {
    const cart = loadCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update count in element with ID globalCartCount
    const globalCountEl = document.getElementById('globalCartCount');
    if (globalCountEl) {
        globalCountEl.textContent = count;
    }

    // Also update any header-cart-chip badge counts on the page
    const headerCartCounts = document.querySelectorAll('#headerCartCount, .headerCartCount');
    headerCartCounts.forEach(el => {
        el.textContent = count;
    });

    const headerSubtotals = document.querySelectorAll('#headerCartSubtotal, .headerCartSubtotal');
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    headerSubtotals.forEach(el => {
        el.textContent = `₹${subtotal}`;
    });
}

// Open the Offcanvas drawer
function openCartDrawer() {
    const offcanvasEl = document.getElementById('globalCartOffcanvas');
    if (offcanvasEl) {
        const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
        offcanvas.show();
    }
}

// Handle Add to Cart or Buy Now clicks
function handleCartActions(button, isBuyNow) {
    const name = button.dataset.name;
    const card = button.closest('.card, .pizza-card, .menu-card');
    
    if (!name || !card) return;

    const priceText = card.querySelector('.price-pill')?.textContent || '0';
    const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
    const slug = getPageSlug();

    const cart = loadCart();
    const existing = cart.find(item => item.name === name && item.page === slug);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1,
            page: slug
        });
    }

    saveCart(cart);
    renderCart();

    if (isBuyNow) {
        openCartDrawer();
    } else {
        showGlobalToast(`"${name}" added to cart`);
    }
}

// Setup Event Listeners
function setupCartEventListeners() {
    // Listen for add-to-order (Add to Cart) and buy-now-btn clicks
    document.body.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-order');
        const buyNowBtn = e.target.closest('.buy-now-btn');

        if (addToCartBtn) {
            e.preventDefault();
            handleCartActions(addToCartBtn, false);
        } else if (buyNowBtn) {
            e.preventDefault();
            handleCartActions(buyNowBtn, true);
        }
    });

    // Clear cart handler
    const clearBtn = document.getElementById('globalClearCartBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            saveCart([]);
            renderCart();
            showGlobalToast('Cart cleared');
        });
    }

    // Pay now handler
    const payBtn = document.getElementById('globalPayNowBtn');
    if (payBtn) {
        payBtn.addEventListener('click', () => {
            const method = document.querySelector('input[name="globalPaymentMethod"]:checked')?.value || 'UPI';
            showGlobalToast(`Payment successful via ${method.toUpperCase()}! Thank you for ordering.`);
            
            // Success animation or feedback
            saveCart([]);
            renderCart();
            
            // Close drawer after short delay
            setTimeout(() => {
                const offcanvasEl = document.getElementById('globalCartOffcanvas');
                if (offcanvasEl) {
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
                    if (offcanvas) offcanvas.hide();
                }
            }, 1000);
        });
    }

    // Intercept cart logo clicks to load correct render list and show payment option
    document.querySelectorAll('.header-cart-chip, #globalCartBtn').forEach(el => {
        el.removeAttribute('href'); // Prevent jumping
        el.addEventListener('click', (e) => {
            e.preventDefault();
            renderCart();
            openCartDrawer();
        });
    });
}

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
    injectCartDOM();
    updateCartCount();
    setupCartEventListeners();
    renderCart();
});
