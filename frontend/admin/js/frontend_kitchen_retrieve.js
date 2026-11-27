async function loadOrders() {
    if (isLoadingOrders) return;
    isLoadingOrders = true;
    try {
        const response = await fetch(`${API_URL}/orders`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load orders.');
        }
        orders = result.data || [];
        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        pendingOrdersSContainer.innerHTML = `
            <div class="empty-orders"><p>Unable to load orders. Check the server connection.</p></div>`;
    } finally {
        isLoadingOrders = false;
    }
}

function sortOrdersOldestFirst(orderList) {
    return [...orderList].sort((a, b) => {
        const dateA = new Date(a.order_date).getTime();
        const dateB = new Date(b.order_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return Number(a.daily_order_number ?? a.order_id) - Number(b.daily_order_number ?? b.order_id);
    });
}

function renderOrders() {
    const sorted = sortOrdersOldestFirst(orders);
    const pending = sorted.filter(order => order.status === 'Pending');
    const preparing = sorted.filter(order => order.status === 'Preparing');
    const ready = sorted.filter(order => order.status === 'Ready');
    const completed = sorted.filter(order => order.status === 'Completed' && !removedCompletedOrders.includes(Number(order.order_id)));
    updateCounts(pending.length, preparing.length, ready.length, completed.length);
    renderOrderColumn(pending, pendingOrdersContainer, 'pending');
    renderOrderColumn(preparing, preparingOrdersContainer, 'preparing');
    renderOrderColumn(ready, readyOrdersContainer, 'ready');
    renderOrderColumn(completed, completedOrdersContainer, 'completed');
}

function updateCounts(pending, preparing, ready, completed) {
    pendingCount.textContent = pending;
    preparingCount.textContent = preparing;
    readyCount.textContent = ready;
    completedCount.textContent = completed;
    pendingBadge.textContent = pending;
    preparingBadge.textContent = preparing;
    readyBadge.textContent = ready;
    completedBadge.textContent = completed;
}

