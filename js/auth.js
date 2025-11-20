/* FIREBASE CONFIG */
  const firebaseConfig = {
    apiKey: "AIzaSyA3xq-8F7fyPOqmu-UgMqumpHflzPBEHq8",
    authDomain: "colege-fff21.firebaseapp.com",
    projectId: "colege-fff21",
    storageBucket: "colege-fff21.firebasestorage.app",
    messagingSenderId: "83184348948",
    appId: "1:83184348948:web:6b447dbadfd43843f91c01",
    measurementId: "G-P89Z00EPBS"
  };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function msg(m){ document.getElementById("msg").innerText = m; }

/* STUDENT SIGNUP */
document.getElementById("signupBtn").onclick = async () => {
  const email = email.value.trim();
  const pass = password.value.trim();

  if(!email.endsWith("@sit.ac.in")){
    msg("Use @sit.ac.in email!");
    return;
  }

  try{
    const u = await auth.createUserWithEmailAndPassword(email,pass);
    msg("Account created!");
    window.location.href="student_home.html";
  }catch(e){
    msg(e.message);
  }
};

/* STUDENT LOGIN */
document.getElementById("loginBtn").onclick = async () => {
  const email = email.value.trim();
  const pass = password.value.trim();

  try{
    await auth.signInWithEmailAndPassword(email,pass);
    window.location.href="student_home.html";
  }catch(e){
    msg(e.message);
  }
};
