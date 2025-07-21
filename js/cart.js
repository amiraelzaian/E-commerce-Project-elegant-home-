import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "./firebase_config.js";

// Remove item from cart with direct DOM update
function removeFromCart(userID, product, cardElement) {
  const cartItemRef = doc(db, "Carts", userID, "cartItems", product.id);
  getDoc(cartItemRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const currentQuantity = docSnap.data().quantity || 1;
        if (currentQuantity > 1) {
          setDoc(
            cartItemRef,
            { quantity: currentQuantity - 1 },
            { merge: true }
          ).then(() => {
            const quantityElem = cardElement.querySelector(".quantity");
            quantityElem.textContent = `Quantity: ${currentQuantity - 1}`;
            updateBillAfterChange(userID);
          });
        } else {
          deleteDoc(cartItemRef).then(() => {
            cardElement.remove();
            updateBillAfterChange(userID);
          });
        }
      }
    })
    .catch((err) => {
      console.error("Error removing from cart:", err);
    });
}

// Cart container
const cartContainer = document.querySelector(".products-cart");

// Render cart item with remove button
function renderCartItem(item, userID) {
  const card = document.createElement("div");
  card.classList.add("cart-item-card");
  card.innerHTML = `
    <img class='card-img' src="${item.imageUrl}" />
    <p class='product-name'>${item.name}</p>
    <p class='price'>Price: ${item.price}</p>
    <p class='quantity'>Quantity: ${item.quantity}</p>
  `;

  const removeBtn = document.createElement("button");
  removeBtn.classList.add("remove-item");
  removeBtn.innerHTML = `<i class='fas fa-minus'></i>`;

  removeBtn.addEventListener("click", () => {
    removeFromCart(userID, item, card);
  });

  card.appendChild(removeBtn);
  cartContainer.appendChild(card);
}

// Fetch and render user's cart
function fetchUserCart(userID) {
  console.log("Fetching Cart for user:", userID);
  const userCartRef = collection(db, "Carts", userID, "cartItems");
  getDocs(userCartRef)
    .then((querySnapShot) => {
      console.log("Cart Items Fetched:", querySnapShot.size);
      cartContainer.innerHTML = "";

      const cartData = [];
      querySnapShot.forEach((docSnap) => {
        const data = docSnap.data();
        data.id = docSnap.id;
        renderCartItem(data, userID);
        cartData.push(data);
      });

      console.log("Cart Data Array:", cartData);
      renderBill(cartData, userID);
    })
    .catch((err) => {
      console.log("Error fetching cart", err);
    });
}

// Update bill after cart changes
function updateBillAfterChange(userID) {
  const userCartRef = collection(db, "Carts", userID, "cartItems");
  getDocs(userCartRef).then((querySnapShot) => {
    const cartData = [];
    querySnapShot.forEach((docSnap) => {
      const data = docSnap.data();
      data.id = docSnap.id;
      cartData.push(data);
    });
    renderBill(cartData, userID);
  });
}

// Listen to auth state and fetch cart
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in");
    fetchUserCart(user.uid);
  } else {
    console.log("No user signed in");
  }
});

// Render the bill with download option
function renderBill(items, userID) {
  const payingContainer = document.querySelector(".paying-container");
  payingContainer.innerHTML = `
    <div class='bill-header'>
      <img src='imgs/logo.png'/>
      <h2> The Bill </h2>
    </div>
    <div class='cust'>ID: ${userID}</div>
    <table class='bill-table'>
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${item.price * item.quantity} LE</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <div class="total-amount">
      The Total amount: ${items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )} LE
    </div>
    <button class="download-bill">Download PDF</button>
  `;

  document.querySelector(".download-bill").addEventListener("click", () => {
    const button = document.querySelector(".download-bill");
    const bill = document.querySelector(".paying-container");
    const { jsPDF } = window.jspdf;

    button.style.display = "none";

    html2canvas(bill).then((canvas) => {
      button.style.display = "block";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("bill.pdf");
    });
  });
}
