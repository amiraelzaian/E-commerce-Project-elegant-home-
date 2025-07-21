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

// code
let idContainer = document.querySelector(".data-part .id");
let emailContainer = document.querySelector(".data-part .email");
let roleContainer = document.querySelector(".data-part .role");
let usernameContainer = document.querySelector(".data-part .name");
let welcomeContainer = document.querySelector(".welcome-user");

function renderProfile(userID) {
  console.log("user is ", userID);
  const userInfoRef = doc(db, "users", userID);
  getDoc(userInfoRef)
    .then((userInfo) => {
      if (userInfo.exists()) {
        const data = userInfo.data();
        idContainer.innerHTML = `User ID: ${data.uid}`;
        usernameContainer.innerHTML = `Username: ${data.user}`;
        emailContainer.innerHTML = `User email: ${data.email}`;
        roleContainer.innerHTML = `User role: ${data.role}`;
        welcomeContainer.innerHTML = `Hi: ${data.user}, Have a nice day.`;
      } else {
        console.error("No user data found for this ID");
      }
    })
    .catch((error) => {
      console.error("Error getting user info:", error);
    });
}

// manage authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in");
    renderProfile(user.uid);
  } else {
    console.log("No user signed in");
  }
});
