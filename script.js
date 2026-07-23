const defaultSales = [];
const OWNER_CODE = "B@nana2012!";
const COMMISSION_RATE = 0.15;

const storageKeys = {
  sales: "robloxSalesListings",
  pending: "robloxPendingRequests",
  ownerAccess: "robloxOwnerAccess",
};

const saleGrid = document.getElementById("saleGrid");
const sellerForm = document.getElementById("sellerForm");
const formMessage = document.getElementById("formMessage");
const adminPendingList = document.getElementById("adminPendingList");
const adminApprovedList = document.getElementById("adminApprovedList");
const refreshPendingButton = document.getElementById("refreshPendingButton");
const ownerPasswordInput = document.getElementById("ownerPasswordInput");
const unlockOwnerButton = document.getElementById("unlockOwnerButton");
const ownerStatusMessage = document.getElementById("ownerStatusMessage");
const adminFab = document.getElementById("adminFab");
const adminModal = document.getElementById("adminModal");
const adminClose = document.getElementById("adminClose");
const adminLockedView = document.getElementById("adminLockedView");
const offerModal = document.getElementById("offerModal");
const offerClose = document.getElementById("offerClose");
const offerForm = document.getElementById("counterOfferForm");
const modalListingName = document.getElementById("modalListingName");
const counterOfferMessage = document.getElementById("counterOfferMessage");
const sellerPriceInput = sellerForm?.querySelector('input[name="price"]');
const earningsSaleAmount = document.getElementById("earningsSaleAmount");
const earningsPlatformCut = document.getElementById("earningsPlatformCut");
const earningsSellerPayout = document.getElementById("earningsSellerPayout");

let sales = [];
let pendingRequests = [];
let ownerUnlocked = false;
let activeListingId = null;

function loadStoredData() {
  try {
    const savedSales = JSON.parse(localStorage.getItem(storageKeys.sales));
    const savedPending = JSON.parse(localStorage.getItem(storageKeys.pending));
    const savedOwnerAccess = localStorage.getItem(storageKeys.ownerAccess);
    sales = savedSales && savedSales.length ? savedSales : [...defaultSales];
    pendingRequests = savedPending && savedPending.length ? savedPending : [];
    ownerUnlocked = savedOwnerAccess === "true";
  } catch (error) {
    sales = [...defaultSales];
    pendingRequests = [];
    ownerUnlocked = false;
  }
}

function saveSales() {
  localStorage.setItem(storageKeys.sales, JSON.stringify(sales));
}

function savePendingRequests() {
  localStorage.setItem(storageKeys.pending, JSON.stringify(pendingRequests));
}

function saveOwnerAccess() {
  localStorage.setItem(storageKeys.ownerAccess, ownerUnlocked ? "true" : "false");
}

function openAdminModal() {
  if (!adminModal) {
    return;
  }

  adminModal.classList.remove("hidden");
  adminModal.setAttribute("aria-hidden", "false");
}

function closeAdminModal() {
  if (!adminModal) {
    return;
  }

  adminModal.classList.add("hidden");
  adminModal.setAttribute("aria-hidden", "true");
}

function updateAdminVisibility() {
  if (!adminLockedView) {
    return;
  }

  adminLockedView.classList.toggle("hidden", !ownerUnlocked);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function parsePriceInput(value) {
  if (!value || typeof value !== "string") {
    return 0;
  }

  const cleanedValue = value.replace(/[^\d.]/g, "");
  const amount = Number.parseFloat(cleanedValue);
  return Number.isFinite(amount) ? amount : 0;
}

function updateEarningsPreview() {
  if (!sellerPriceInput || !earningsSaleAmount || !earningsPlatformCut || !earningsSellerPayout) {
    return;
  }

  const enteredPrice = sellerPriceInput.value.trim();
  const defaultPrice = sellerPriceInput.placeholder || "$500";
  const saleAmount = parsePriceInput(enteredPrice || defaultPrice);
  const platformCut = saleAmount * COMMISSION_RATE;
  const sellerPayout = Math.max(saleAmount - platformCut, 0);

  earningsSaleAmount.textContent = formatCurrency(saleAmount);
  earningsPlatformCut.textContent = formatCurrency(platformCut);
  earningsSellerPayout.textContent = formatCurrency(sellerPayout);
}


function renderSales() {
  if (!sales.length) {
    saleGrid.innerHTML = '<article class="sale-card"><span class="sale-badge">Waiting</span><h3>No approved listings yet</h3><p>Once a seller request is approved by the owner admin, the account will appear here for buyers.</p></article>';
    return;
  }

  saleGrid.innerHTML = sales
    .map(
      (sale) => `
        <article class="sale-card" data-sale-id="${sale.id}" tabindex="0" role="button" aria-label="Open counter offer for ${sale.name}">
          <span class="sale-badge">${sale.badge}</span>
          <h3>${sale.name}</h3>
          <p>${sale.description}</p>
          <div class="sale-price">${sale.price}</div>
          <div class="sale-meta">Buyer contact via your email / Discord</div>
          <div class="sale-meta">Payment types: ${sale.paymentTypes.join(", ")}</div>
          ${ownerUnlocked ? `<button class="btn secondary" type="button" data-delete-sale-id="${sale.id}">Delete listing</button>` : ""}
        </article>
      `
    )
    .join("");
}

function renderPendingRequests() {
  if (!adminPendingList) {
    return;
  }

  if (!pendingRequests.length) {
    adminPendingList.innerHTML = '<div class="admin-item"><p>No pending seller requests yet.</p></div>';
    return;
  }

  adminPendingList.innerHTML = pendingRequests
    .map(
      (request) => `
        <div class="admin-item">
          <h3>${request.robloxUser}</h3>
          <p><strong>Email:</strong> ${request.email}</p>
          <p><strong>Ask:</strong> ${request.price}</p>
          <p><strong>Payment types:</strong> ${request.paymentTypes}</p>
          <p><strong>Details:</strong> ${request.details}</p>
          <p><strong>Seller photos:</strong> ${request.photos?.length || 0}</p>
          <button class="btn primary" type="button" data-approve-id="${request.id}">Approve and publish</button>
        </div>
      `
    )
    .join("");
}

function renderApprovedListings() {
  if (!adminApprovedList) {
    return;
  }

  if (!sales.length) {
    adminApprovedList.innerHTML = '<div class="admin-item"><p>No approved listings are live yet.</p></div>';
    return;
  }

  adminApprovedList.innerHTML = sales
    .map(
      (sale) => `
        <div class="admin-item">
          <h3>${sale.name}</h3>
          <p><strong>Ask:</strong> ${sale.price}</p>
          <p><strong>Payment types:</strong> ${sale.paymentTypes.join(", ")}</p>
          <p><strong>Details:</strong> ${sale.description}</p>
          <p><strong>Seller photos:</strong> ${sale.photos?.length || 0}</p>
          <button class="btn secondary" type="button" data-delete-sale-id="${sale.id}">Delete listing</button>
        </div>
      `
    )
    .join("");
}

function createApprovedSale(request) {
  return {
    id: `sale-${Date.now()}`,
    name: request.robloxUser,
    price: request.price,
    badge: "Approved",
    description: request.details,
    paymentTypes: request.paymentTypes.split(", ").filter(Boolean),
    photos: request.photos || [],
  };
}

function buildSellerEmailBody(payload) {
  return [
    "New Seller Listing Request",
    "--------------------------",
    `Email: ${payload.email}`,
    `Roblox username: ${payload.robloxUser}`,
    `Asking price: ${payload.price}`,
    `Payment types: ${payload.paymentTypes}`,
    `Account details: ${payload.details}`,
    `Seller proof photos: ${payload.photos.join(", ") || "None"}`,
  ].join("\n");
}

function openOfferModal(listingId) {
  const listing = sales.find((item) => item.id === listingId);

  if (!listing) {
    return;
  }

  activeListingId = listingId;
  modalListingName.textContent = listing.name;
  offerModal.classList.remove("hidden");
  offerModal.setAttribute("aria-hidden", "false");
}

function closeOfferModal() {
  activeListingId = null;
  offerModal.classList.add("hidden");
  offerModal.setAttribute("aria-hidden", "true");
  counterOfferForm.reset();
  counterOfferMessage.textContent = "";
}

adminFab?.addEventListener("click", openAdminModal);
adminClose?.addEventListener("click", closeAdminModal);
adminModal?.addEventListener("click", (event) => {
  if (event.target === adminModal) {
    closeAdminModal();
  }
});

unlockOwnerButton.addEventListener("click", () => {
  const enteredCode = ownerPasswordInput.value.trim();

  if (enteredCode === OWNER_CODE) {
    ownerUnlocked = true;
    saveOwnerAccess();
    ownerStatusMessage.textContent = "Owner access unlocked.";
    updateAdminVisibility();
    renderSales();
    renderPendingRequests();
    renderApprovedListings();
    closeAdminModal();
  } else {
    ownerUnlocked = false;
    saveOwnerAccess();
    updateAdminVisibility();
    ownerStatusMessage.textContent = "Incorrect owner code.";
  }
});

sellerPriceInput?.addEventListener("input", updateEarningsPreview);

sellerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(sellerForm);
  const email = formData.get("email");
  const robloxUser = formData.get("robloxUser");
  const price = formData.get("price");
  const details = formData.get("details");
  const paymentTypes = sellerForm.querySelectorAll('input[name="paymentTypes"]:checked');
  const selectedPayments = Array.from(paymentTypes).map((item) => item.value).join(", ");
  const sellerPhotoInput = sellerForm.querySelector('input[name="sellerPhotos"]');
  const sellerPhotoFiles = Array.from(sellerPhotoInput?.files || []).filter(Boolean);

  if (!sellerPhotoFiles.length) {
    formMessage.textContent = "Please add at least one seller proof photo before submitting.";
    return;
  }

  const payload = {
    email,
    robloxUser,
    price,
    paymentTypes: selectedPayments || "None selected",
    details,
    photos: sellerPhotoFiles.map((file) => file.name),
  };

  const requestRecord = {
    id: Date.now().toString(),
    ...payload,
  };

  pendingRequests.unshift(requestRecord);
  savePendingRequests();
  renderPendingRequests();

  const sellerEmailBody = buildSellerEmailBody(payload);

  try {
    const response = await fetch("https://formspree.io/f/mgoglpkq", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Form submission failed");
    }

    formMessage.textContent = "Your request has been saved for review and sent to the configured inbox.";
  } catch (error) {
    formMessage.textContent = "Your request is queued for review. Your email app is opening so you can send the seller request directly to the owner.";
    window.location.href = `mailto:doormansales123@gmail.com?subject=${encodeURIComponent("Sell My Roblox Account Listing Request")}&body=${encodeURIComponent(sellerEmailBody)}`;
  }

  sellerForm.reset();
  updateEarningsPreview();
});

refreshPendingButton.addEventListener("click", () => {
  renderPendingRequests();
  renderApprovedListings();
});

document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-sale-id]");
  const card = event.target.closest("[data-sale-id]");

  if (deleteButton && ownerUnlocked) {
    const listingId = deleteButton.getAttribute("data-delete-sale-id");
    sales = sales.filter((item) => item.id !== listingId);
    saveSales();
    renderSales();
    renderApprovedListings();
    formMessage.textContent = "The listing has been deleted from the public sales tab.";
    return;
  }

  if (card && !deleteButton) {
    openOfferModal(card.getAttribute("data-sale-id"));
  }

  const approveButton = event.target.closest("[data-approve-id]");

  if (!approveButton) {
    return;
  }

  const requestId = approveButton.getAttribute("data-approve-id");
  const request = pendingRequests.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const approvedListing = createApprovedSale(request);
  sales.push(approvedListing);
  saveSales();
  renderSales();
  renderApprovedListings();

  pendingRequests = pendingRequests.filter((item) => item.id !== requestId);
  savePendingRequests();
  renderPendingRequests();

  formMessage.textContent = `${request.robloxUser} has been approved and added to the public sales tab.`;
});

offerClose.addEventListener("click", closeOfferModal);

offerModal.addEventListener("click", (event) => {
  if (event.target === offerModal) {
    closeOfferModal();
  }
});

offerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(offerForm);
  const discord = formData.get("discord");
  const requestType = formData.get("requestType");
  const offerMessage = formData.get("offerMessage");

  if (!discord || !requestType || !offerMessage) {
    counterOfferMessage.textContent = "Please fill in Discord, choose a request type, and add your message.";
    return;
  }

  const mailBody = [
    "Buyer Request",
    "-------------",
    `Listing ID: ${activeListingId}`,
    `Discord: ${discord}`,
    `Request Type: ${requestType}`,
    `Message: ${offerMessage}`,
  ].join("\n");

  counterOfferMessage.textContent = "Your request has been prepared and will open in your email app for sending to the owner.";
  window.location.href = `mailto:doormansales123@gmail.com?subject=Buyer%20Listing%20Request&body=${encodeURIComponent(mailBody)}`;
  closeOfferModal();
});

loadStoredData();
renderSales();
renderPendingRequests();
renderApprovedListings();
updateAdminVisibility();
updateEarningsPreview();
if (!ownerUnlocked) {
  ownerStatusMessage.textContent = "Owner access required to manage listings.";
}
