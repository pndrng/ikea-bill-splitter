const INVOICE_TOTAL = 24055.00;
const DISCOUNT = 800.00;
let items = [];
let users = [];
let allocations = {}; // { productId: { userId: qty } }

// Helper for currency formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

// Generate a random color for user avatar
const getRandomColor = () => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Initialize App
const init = async () => {
    try {
        const response = await fetch('data/invoice_items.json');
        items = await response.json();
        
        // Initialize empty allocations
        items.forEach(item => {
            allocations[item.id] = {};
        });
        
        setupEventListeners();
        renderProducts();
        updateSummary();
    } catch (error) {
        console.error("Error loading items:", error);
    }
};

// Setup DOM Event Listeners
const setupEventListeners = () => {
    const addBtn = document.getElementById('add-user-btn');
    const input = document.getElementById('new-user-input');
    
    const addUser = () => {
        const name = input.value.trim();
        if (name) {
            const newUser = {
                id: Date.now().toString(),
                name: name,
                color: getRandomColor()
            };
            users.push(newUser);
            input.value = '';
            renderUsers();
            renderProducts(); // Re-render to show allocation controls for new user
            updateSummary();
        }
    };
    
    addBtn.addEventListener('click', addUser);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addUser();
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderProducts(term);
    });
};

// Render Users List in Sidebar
const renderUsers = () => {
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    
    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        li.innerHTML = `
            <div>
                <span class="user-color" style="background-color: ${user.color}"></span>
                ${user.name}
            </div>
        `;
        list.appendChild(li);
    });
};

// Calculate how many of a specific item are already allocated
const getAllocatedQty = (productId) => {
    const itemAllocations = allocations[productId];
    return Object.values(itemAllocations).reduce((sum, qty) => sum + qty, 0);
};

// Handle changing quantity
const changeQty = (productId, userId, delta) => {
    const item = items.find(i => i.id === productId);
    const currentAllocated = getAllocatedQty(productId);
    const userQty = allocations[productId][userId] || 0;
    
    if (delta > 0 && currentAllocated < item.qty) {
        allocations[productId][userId] = userQty + 1;
    } else if (delta < 0 && userQty > 0) {
        allocations[productId][userId] = userQty - 1;
    }
    
    // Update specific card without full re-render
    updateProductCard(productId);
    updateSummary();
};

// Update a single product card's allocation UI
const updateProductCard = (productId) => {
    const item = items.find(i => i.id === productId);
    const currentAllocated = getAllocatedQty(productId);
    
    // Update user controls
    users.forEach(user => {
        const qtyDisplay = document.getElementById(`qty-${productId}-${user.id}`);
        const btnMinus = document.getElementById(`btn-minus-${productId}-${user.id}`);
        const btnPlus = document.getElementById(`btn-plus-${productId}-${user.id}`);
        
        if (qtyDisplay && btnMinus && btnPlus) {
            const userQty = allocations[productId][user.id] || 0;
            qtyDisplay.textContent = userQty;
            btnMinus.disabled = userQty === 0;
            btnPlus.disabled = currentAllocated >= item.qty;
        }
    });
    
    // Update badge
    const badge = document.getElementById(`badge-${productId}`);
    if (badge) {
        const unallocated = item.qty - currentAllocated;
        if (unallocated === 0) {
            badge.className = 'unallocated-badge success';
            badge.textContent = 'All Assigned';
        } else {
            badge.className = 'unallocated-badge';
            badge.textContent = `${unallocated} left to assign`;
        }
    }
};

// Render Products Grid
const renderProducts = (searchTerm = '') => {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.id.includes(searchTerm)
    );
    
    filteredItems.forEach(item => {
        const currentAllocated = getAllocatedQty(item.id);
        const unallocated = item.qty - currentAllocated;
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.id = `card-${item.id}`;
        
        let usersHtml = '';
        if (users.length === 0) {
            usersHtml = '<p class="note">Add people to assign items.</p>';
        } else {
            usersHtml = users.map(user => {
                const userQty = allocations[item.id][user.id] || 0;
                return `
                    <div class="allocation-item">
                        <div class="allocation-user">
                            <span class="user-color" style="background-color: ${user.color}"></span>
                            ${user.name}
                        </div>
                        <div class="qty-controls">
                            <button id="btn-minus-${item.id}-${user.id}" class="qty-btn" ${userQty === 0 ? 'disabled' : ''} onclick="changeQty('${item.id}', '${user.id}', -1)">-</button>
                            <span id="qty-${item.id}-${user.id}" class="qty-display">${userQty}</span>
                            <button id="btn-plus-${item.id}-${user.id}" class="qty-btn" ${currentAllocated >= item.qty ? 'disabled' : ''} onclick="changeQty('${item.id}', '${user.id}', 1)">+</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const badgeClass = unallocated === 0 ? 'unallocated-badge success' : 'unallocated-badge';
        const badgeText = unallocated === 0 ? 'All Assigned' : `${unallocated} left to assign`;

        card.innerHTML = `
            <img class="product-image" src="assets/images/${item.id}.jpg" alt="${item.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' fill=\\'%23f1f5f9\\'><rect width=\\'100%\\' height=\\'100%\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%2394a3b8\\'>No Image</text></svg>'">
            <div class="product-info">
                <div class="product-title" title="${item.name}">${item.name}</div>
                <div class="product-id">Art. ${item.id}</div>
                <div class="product-price-row">
                    <div class="price-unit">${formatCurrency(item.unit_price)} x ${item.qty}</div>
                    <div class="price-total">${formatCurrency(item.total_price)}</div>
                </div>
                <div class="allocation-list">
                    ${usersHtml}
                </div>
                <div id="badge-${item.id}" class="${badgeClass}">${badgeText}</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
};

// Calculate and update summary
const updateSummary = () => {
    const summaryList = document.getElementById('summary-list');
    const allocatedTotalEl = document.getElementById('allocated-total');
    
    if (users.length === 0) {
        summaryList.innerHTML = '<p class="note">Add people to see summary.</p>';
        allocatedTotalEl.textContent = formatCurrency(0);
        return;
    }
    
    // Calculate raw totals
    let totalAllocatedSum = 0;
    const userTotals = {};
    
    users.forEach(user => {
        let sum = 0;
        items.forEach(item => {
            const qty = allocations[item.id][user.id] || 0;
            sum += qty * item.unit_price;
        });
        userTotals[user.id] = sum;
        totalAllocatedSum += sum;
    });
    
    allocatedTotalEl.textContent = formatCurrency(totalAllocatedSum);
    
    // Proportional Discount Application
    // We only apply discount if there is a total sum, otherwise divide equally or don't apply
    summaryList.innerHTML = '';
    
    users.forEach(user => {
        const rawTotal = userTotals[user.id];
        let discountShare = 0;
        
        if (totalAllocatedSum > 0) {
            const proportion = rawTotal / totalAllocatedSum;
            discountShare = proportion * DISCOUNT;
        }
        
        const finalTotal = Math.max(0, rawTotal - discountShare);
        
        const row = document.createElement('div');
        row.className = 'summary-row';
        row.innerHTML = `
            <div class="name">
                <span class="user-color" style="background-color: ${user.color}"></span>
                ${user.name}
            </div>
            <div class="amounts">
                <span class="final">${formatCurrency(finalTotal)}</span>
                <span class="subtotal">${formatCurrency(rawTotal)} - ${formatCurrency(discountShare)} off</span>
            </div>
        `;
        summaryList.appendChild(row);
    });
};

// Expose changeQty globally for inline onclick handlers
window.changeQty = changeQty;

// Boot
document.addEventListener('DOMContentLoaded', init);
