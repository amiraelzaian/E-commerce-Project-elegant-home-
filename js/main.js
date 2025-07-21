// main.js
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  onSnapshot,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  getDocs,
  setDoc,
  increment,
  deleteDoc,
  updateDoc,
} from "./firebase_config.js";

// left list
let burgerIcon = document.querySelector(".fas.fa-bars");
let exit = document.querySelector(".fas.fa-times");
let menu = document.querySelector(".right-list ul");
let overlay = document.querySelector(".overlay");
if (burgerIcon) {
  burgerIcon.addEventListener("click", () => {
    if (menu.classList.contains("show")) {
      menu.classList.remove("show");
      overlay.style.display = "none";
    } else {
      menu.classList.add("show");
      overlay.style.display = "block";
    }
  });
}
if (exit) {
  exit.addEventListener("click", () => {
    menu.classList.remove("show");
    overlay.style.display = "none";
  });
}
overlay.addEventListener("click", () => {
  menu.classList.remove("show");
  overlay.style.display = "none";
});
// create new account li
window.addEventListener("DOMContentLoaded", () => {
  const newAcc = document.getElementById("newAcc");
  if (!newAcc) return;
  newAcc.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        window.location.href = "signup.html";
      })
      .catch((err) => {
        console.log(err.message);
      });
  });
});

///
/// welecome typing machine effect
let headingText = "Elegant Home";
let pragraphText =
  "Where comfort meets elegance, Build Your Home with our elegant furniture, Designed to fit your style — crafted to last ";
let boldText = `<strong style="color:#510201;">Join Us</strong>`;

let heading = document.querySelector(".home-text h1");
let paragraph = document.querySelector(".home-text p");
let headingIndex = 0;
let paragraphIndex = 0;
if (heading && paragraph) {
  let typeHeading = function () {
    if (headingIndex < headingText.length) {
      heading.innerHTML += headingText.charAt(headingIndex);
      headingIndex++;
      setTimeout(typeHeading, 99);
    } else {
      setTimeout(typeParagraph, 500);
    }
  };

  let typeParagraph = function () {
    if (paragraphIndex < pragraphText.length) {
      if (paragraphIndex == 118) paragraph.innerHTML += `<br>`;

      paragraph.innerHTML += pragraphText.charAt(paragraphIndex);
      paragraphIndex++;
      setTimeout(typeParagraph, 45);
    } else {
      paragraph.innerHTML += boldText;
      downArrow();
    }
  };
  window.onload = typeHeading;
}

// create down arrow
let downArrow = function () {
  let conainer = document.querySelector(".home-text");
  let arrow = document.createElement("i");
  arrow.classList.add("fa-solid");
  arrow.classList.add("fa-angles-down");
  arrow.classList.add("arrow");
  conainer.appendChild(arrow);
};

// add to firestore
async function addProductToFireStore({ imageUrl, title, price, stock }) {
  await addDoc(collection(db, "products"), {
    imageUrl,
    title,
    price,
    stock,
    createdAt: serverTimestamp(),
  });
}
// fetch elements from html
// if (form || titleInput || priceInput || stockInput || imageInput) {
// admin panel
const form = document.getElementById("product-form");
const titleInput = form.querySelector('input[name="title"]');
const priceInput = form.querySelector('input[name="price"]');
const stockInput = form.querySelector('input[name="stock"]');
const imageInput = document.getElementById("fileUpload");
// }

// upload imgs  to cloudinary
async function uploadImgsOnCloudinary(file) {
  if (!file) throw new error("Image isn't existed");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Unsigned_image");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dea11qjic/image/upload",
    {
      method: "post",
      body: formData,
    }
  );
  if (!response.ok) throw new error("Image uploading failed");
  const data = await response.json();
  return data.secure_url;
}

// handle form
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const price = parseFloat(priceInput.value);
  const stock = parseInt(stockInput.value);
  const file = imageInput.files[0];

  if (!title || price <= 0 || stock < 0 || !file) {
    return alert("Plz fill fields properly ");
  }

  try {
    const imageUrl = await uploadImgsOnCloudinary(file);
    await addProductToFireStore({ imageUrl, title, price, stock });
    alert("product add successfully");
    form.reset();
  } catch (err) {
    console.log(err.message);
    alert("failed adding, try again");
  }
});

// autherization of admin panel
document.addEventListener("DOMContentLoaded", () => {
  let adminPanel = document.querySelector(".admin-panel");

  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed:", user);

    if (!user) {
      console.log("No user logged in");
      adminPanel.style.display = "none";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const usersnap = await getDoc(userRef);
    if (usersnap.exists() && usersnap.data().role === "admin") {
      adminPanel.style.display = "block";
    } else {
      adminPanel.style.display = "none";
    }
  });
});
// display products in Products part
const productsWrapper = document.querySelector(".products-wrapper");
async function fetchProducts() {
  const productRef = collection(db, "products");
  const snapShot = await getDocs(productRef);
  productsWrapper.innerHTML = "";
  snapShot.forEach((doc) => {
    const product = doc.data();
    const card = document.createElement("div");
    card.classList.add("card-wrapper");

    card.innerHTML = `
     <img src="${product.imageUrl}" alt="${product.title}" class="card-img" />
  <p class="product-name">${product.title}</p>
  <p class="price">Price: ${product.price} LE</p>
  <p class="product-stock">Stock: ${
    product.stock > 0 ? product.stock : "Out of stock"
  }</p>
  <button class="plus-btn"><i class="fa-solid fa-plus"></i></button>
    `;
    card.setAttribute("data-id", product.createdAt);
    productsWrapper.appendChild(card);
  });
}
fetchProducts();

//add or update cart item

function addAndUpdateCart(userID, product) {
  const cartItemRef = doc(db, "Carts", userID, "cartItems", product.id);
  getDoc(cartItemRef)
    .then((docsnap) => {
      if (docsnap.exists()) {
        const currentQuantity = docsnap.data().quantity || 1;
        setDoc(
          cartItemRef,
          {
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: currentQuantity + 1,
          },
          { merge: true }
        );
      } else {
        setDoc(cartItemRef, {
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        });
      }
    })
    .catch((err) => {
      console.error("Error at adding product to cart:", err);
      alert("Something went wrong! Try again.");
    });
}

// Decrease stock
function decreaseProductStock(productId) {
  const productRef = doc(db, "products", productId);
  return getDoc(productRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const currentStock = docSnap.data().stock;
        if (currentStock > 0) {
          return updateDoc(productRef, { stock: increment(-1) });
        } else {
          console.log("Out of stock!");
          return Promise.resolve();
          // empty chainable, to make method return promise
        }
      }
    })
    .catch((err) => {
      console.error("Error decreasing stock:", err);
    });
}

// Update button state based on current stock

productsWrapper.addEventListener("click", (e) => {
  const plusBtn = e.target.closest(".plus-btn");

  if (!plusBtn) return; // Ignore clicks outside buttons

  const productCard = e.target.closest(".card-wrapper");
  if (!productCard) return;

  const stockElement = productCard.querySelector(".product-stock");
  const plusButton = productCard.querySelector(".plus-btn");

  let currentStock =
    parseInt(stockElement.innerText.replace(/[^\d]/g, "")) || 0;

  const product = {
    id: productCard.dataset.id,
    name: productCard.querySelector(".product-name").innerText,
    price: parseFloat(
      productCard.querySelector(".price").innerText.replace(/[^\d.]/g, "")
    ),
    imageUrl: productCard.querySelector(".card-img").src,
  };

  if (plusBtn) {
    if (currentStock > 0) {
      currentStock--;
      stockElement.innerText = `Stock: ${
        currentStock > 0 ? currentStock : "Out of stock"
      }`;
      if (currentStock === 0) {
        plusButton.disabled = true;
        plusButton.classList.add("disabled");
      }
      onAuthStateChanged(auth, (user) => {
        if (user) {
          addAndUpdateCart(user.uid, product);
          decreaseProductStock(product.id);
        } else {
          alert("Please sign in to add products to cart!");
        }
      });
    } else {
      alert("Out of stock!");
    }
  }
});

// slider

let leftArrow = document.querySelector(".wrapper .left");
let rightArrow = document.querySelector(".wrapper .right");
let slides = Array.from(document.querySelectorAll(".slider .img-product"));
let currentSlide = 0;
function updataSlider() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentSlide);
    slide.classList.toggle("disabled", index !== currentSlide);
  });

  if (currentSlide === 0) {
    leftArrow.classList.add("disabled");
  } else {
    leftArrow.classList.remove("disabled");
  }

  if (currentSlide === slides.length - 1) {
    rightArrow.classList.add("disabled");
  } else {
    rightArrow.classList.remove("disabled");
  }
}

updataSlider();

leftArrow.addEventListener("click", () => {
  if (currentSlide > 0) {
    currentSlide--;
    updataSlider();
  }
});

rightArrow.addEventListener("click", () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    updataSlider();
  }
});

// search part
//1-in phone: block the search box
//2- search process:

let searchInput = document.querySelector(".search-input");

let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    let products = Array.from(document.querySelectorAll(".card-wrapper"));
    console.log(products);
    let keyword = searchInput.value.toLowerCase();
    products.forEach((product) => {
      let text = product.textContent.toLowerCase();
      product.style.display = text.includes(keyword) ? "block" : "none";
    });
  }, 300);
});
// handle seach box in phone
let searchIcon = document.getElementsByClassName("fa-search")[0];

searchIcon.addEventListener("click", () => {
  if (window.matchMedia("(max-width: 768px)").matches) {
    if (getComputedStyle(searchInput).display === "none") {
      searchInput.style.display = "block";
      searchInput.style.width = "30px";
    } else {
      searchInput.style.display = "none";
    }
  }
});
