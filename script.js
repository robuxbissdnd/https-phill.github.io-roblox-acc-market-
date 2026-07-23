const defaultSales = [];
const OWNER_CODE = "B@nana2012!";

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
const offerModal = document.getElementById("offerModal");
const offerClose = document.getElementById("offerClose");
const offerForm = document.getElementById("counterOfferForm");
const modalListingName = document.getElementById("modalListingName");
const counterOfferMessage = document.getElementById("counterOfferMessage");

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

unlockOwnerButton.addEventListener("click", () => {
  const enteredCode = ownerPasswordInput.value.trim();

  if (enteredCode === OWNER_CODE) {
    ownerUnlocked = true;
    saveOwnerAccess();
    ownerStatusMessage.textContent = "Owner access unlocked.";
    renderSales();
    renderPendingRequests();
    renderApprovedListings();
  } else {
    ownerUnlocked = false;
    saveOwnerAccess();
    ownerStatusMessage.textContent = "Incorrect owner code.";
  }
});

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
    formMessage.textContent = "Your request is queued for review. Email doormansales123@gmail.com directly if the automated send does not arrive.";
  }

  sellerForm.reset();
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
if (!ownerUnlocked) {
  ownerStatusMessage.textContent = "Owner access required to manage listings.";
}
