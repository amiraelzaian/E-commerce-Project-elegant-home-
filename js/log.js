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

// sing up function
window.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.querySelector(".signup");
  if (!signupForm) return;
  const signUp = async function (e) {
    e.preventDefault();

    const username = signupForm.username.value;
    const email = signupForm.email.value;
    const password = signupForm.password.value;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created:", cred.user);

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: email,
        user: username,
        role: "user",
        createdAt: new Date(),
      });
      console.log("User saved successfully");
      signupForm.reset();
      window.location.href = "home.html";
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        alert("Email is already exist!!");
      } else {
        console.log(err.message);
      }
    }
  };
  signupForm.addEventListener("submit", signUp);
});

// sing in function
window.addEventListener("DOMContentLoaded", () => {
  const signinForm = document.querySelector(".signin");
  if (!signinForm) return;

  signinForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = signinForm.querySelector("#mail").value;
    const password = signinForm.querySelector("#pass").value;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "home.html";
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        alert("This email is not registered. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else {
        console.error(err.message);
        alert("Login failed. Please try again.");
      }
    }
  });
});

// log out
window.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        console.log(err.message);
      });
  });
});
