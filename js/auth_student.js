console.log("auth_student.js LOADED");

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyA3xq-8F7fyPOqmu-UgMqumpHflzPBEHq8",
  authDomain: "colege-fff21.firebaseapp.com",
  projectId: "colege-fff21",
  storageBucket: "colege-fff21.firebasestorage.app",
  messagingSenderId: "83184348948",
  appId: "1:83184348948:web:6b447dbadfd43843f91c01"
};

/* MUST BE FIRST */
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    console.log("Firebase already initialized");
  }
} catch(e) {
  console.error("Firebase initialization error:", e);
}

const auth = firebase.auth();
const db   = firebase.firestore();

/* ERROR / INFO MESSAGE */
function msg(t){
  const box = document.getElementById("msg");
  if(box) box.innerText = t;
}

/* LOGIN & SIGNUP */
document.addEventListener("DOMContentLoaded", ()=>{
  console.log("DOM Content Loaded - Setting up login/signup handlers");

  const logBtn  = document.getElementById("loginBtn");
  const regBtn  = document.getElementById("signupBtn");
  
  console.log("Login button found:", !!logBtn);
  console.log("Signup button found:", !!regBtn);

  if(logBtn){
    logBtn.onclick = async ()=>{
      const emailEl = document.getElementById("email");
      const passEl  = document.getElementById("password");
      
      if(!emailEl || !passEl){
        msg("Error: Form elements not found");
        return;
      }
      
      const email = emailEl.value.trim();
      const pass  = passEl.value.trim();
      
      if(!email || !pass){
        msg("Please enter both email and password");
        return;
      }
      
      try {
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = "student_home.html";
      } catch(e){
        msg(e.message);
      }
    }
  }

  if(regBtn){
    regBtn.onclick = async ()=>{
      const emailEl = document.getElementById("email");
      const passEl  = document.getElementById("password");
      
      if(!emailEl || !passEl){
        msg("Error: Form elements not found");
        return;
      }
      
      const email = emailEl.value.trim();
      const pass  = passEl.value.trim();
      
      if(!email || !pass){
        msg("Please enter both email and password");
        return;
      }

      if(!email.endsWith("@sit.ac.in")){
        msg("Use @sit.ac.in email");
        return;
      }
      
      if(pass.length < 6){
        msg("Password must be at least 6 characters");
        return;
      }

      try {
        await auth.createUserWithEmailAndPassword(email, pass);
        window.location.href = "student_home.html";
      } catch(e){
        msg(e.message);
      }
    }
  }

});

/* LOAD CLASSROOMS */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;

  const list = document.getElementById("classroomList");
  if(!list) return;

  db.collection("classrooms").onSnapshot((snap)=>{
    let html = "";
    snap.forEach(doc=>{
      const d = doc.data();
      const statusClass = d.status === "free" ? "status-free" : d.status === "busy" ? "status-busy" : "status-maintenance";
      html += `
        <div class="card">
          <b>${doc.id}</b>
          <div style="margin:12px 0;">
            <strong>Status:</strong> 
            <span class="status-badge ${statusClass}">${d.status || "free"}</span>
          </div>
          <div style="margin:12px 0;">
            <strong>Noise Level:</strong> ${d.noise || 0}/5
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  });
});

/* SUBMIT ISSUE */
document.addEventListener("DOMContentLoaded", ()=>{

  const btn = document.getElementById("submitIssueBtn");
  if(!btn) return;

  btn.onclick = async ()=>{
    const issueTitleEl = document.getElementById("issueTitle");
    const issueDescEl = document.getElementById("issueDesc");
    const issueMsgEl = document.getElementById("issueMsg");
    
    if(!issueTitleEl || !issueDescEl || !issueMsgEl){
      console.error("Issue form elements not found");
      return;
    }
    
    const t = issueTitleEl.value.trim();
    const d = issueDescEl.value.trim();

    if(t==="" || d===""){
      issueMsgEl.innerText = "Please fill both fields.";
      return;
    }
    
    if(!auth.currentUser){
      issueMsgEl.innerText = "You must be logged in to submit an issue.";
      return;
    }

    try {
      await db.collection("issues").add({
        title: t,
        description: d,
        user: auth.currentUser.email,
        status: "pending",
        time: Date.now()
      });

      issueMsgEl.innerText = "Issue submitted successfully!";
      issueMsgEl.style.color = "var(--success)";
      issueTitleEl.value = "";
      issueDescEl.value = "";
      
      // Switch to My Issues view after 1 second
      setTimeout(() => {
        const myIssuesNav = document.querySelector('.nav-item[data-view="myIssues"]');
        const myIssuesView = document.getElementById("myIssues");
        if(myIssuesNav && myIssuesView){
          document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
          document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
          myIssuesNav.classList.add("active");
          myIssuesView.classList.add("active");
        }
      }, 1000);
    } catch(e){
      issueMsgEl.innerText = "Error: " + e.message;
    }
  };

});

/* NAVIGATION */
document.addEventListener("DOMContentLoaded", ()=>{
  const navItems = document.querySelectorAll(".nav-item[data-view]");
  navItems.forEach(item => {
    item.onclick = (e) => {
      e.preventDefault();
      const viewId = item.getAttribute("data-view");
      
      // Remove active from all nav items and views
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      
      // Add active to clicked nav item and corresponding view
      item.classList.add("active");
      const view = document.getElementById(viewId);
      if(view) view.classList.add("active");
    };
  });
});

/* LOAD MY ISSUES */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;

  const list = document.getElementById("myIssuesList");
  if(!list) return;

  // Load issues for the current user
  db.collection("issues")
    .where("user", "==", user.email)
    .onSnapshot((snap)=>{
      let html = "";
      
      if(snap.empty){
        html = `
          <div class="empty-state">
            <p>You haven't reported any issues yet.</p>
            <p style="margin-top:12px; color:var(--text-secondary);">Go to "Report Issue" to submit a new issue.</p>
          </div>
        `;
      } else {
        // Convert to array and sort by time (descending)
        const issues = [];
        snap.forEach(doc=>{
          issues.push({id: doc.id, ...doc.data()});
        });
        issues.sort((a, b) => (b.time || 0) - (a.time || 0));
        
        issues.forEach(issue=>{
          const d = issue;
          const statusClass = d.status === "pending" ? "status-pending" : "status-resolved";
          const date = d.time ? new Date(d.time) : new Date();
          const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString();
          
          html += `
            <div class="card" style="border-left: 4px solid ${d.status === "resolved" ? "var(--success)" : "var(--warning)"};">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
                <b style="font-size:20px; flex:1; min-width:200px;">${d.title}</b>
                <span class="status-badge ${statusClass}">${d.status}</span>
              </div>
              <p style="margin:12px 0; color:var(--text-secondary); line-height:1.6; padding:12px; background:var(--bg); border-radius:8px;">${d.description}</p>
              <div style="margin:12px 0; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div style="color:var(--text-secondary); font-size:14px;">
                  <strong>Submitted:</strong> ${dateStr}
                </div>
                ${d.status === "resolved" ? 
                  `<div style="color:var(--success); font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:18px;">✓</span> This issue has been resolved!
                  </div>` 
                  : `<div style="color:var(--warning); font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:18px;">⏳</span> Pending review
                  </div>`
                }
              </div>
            </div>
          `;
        });
      }
      
      list.innerHTML = html;
    }, (error) => {
      console.error("Error loading issues:", error);
      list.innerHTML = `
        <div class="empty-state">
          <p style="color:var(--danger);">Error loading issues. Please refresh the page.</p>
        </div>
      `;
    });
});

/* ========== FEATURE 1: ANNOUNCEMENTS (STUDENT) ========== */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;
  
  const list = document.getElementById("announcementList");
  if(!list) return;
  
  db.collection("announcements")
    .orderBy("time", "desc")
    .limit(20)
    .onSnapshot((snap)=>{
      let html = "";
      
      if(snap.empty){
        html = `<div class="empty-state"><p>No announcements yet.</p></div>`;
      } else {
        snap.forEach(doc=>{
          const d = doc.data();
          const date = new Date(d.time);
          const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString();
          
          html += `
            <div class="card" style="border-left: 4px solid var(--accent);">
              <b style="font-size:20px;">${d.title}</b>
              <p style="margin:12px 0; color:var(--text-secondary); line-height:1.6; padding:12px; background:var(--bg); border-radius:8px;">${d.content}</p>
              <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border); color:var(--text-secondary); font-size:14px;">
                Posted on: ${dateStr}
              </div>
            </div>
          `;
        });
      }
      
      list.innerHTML = html;
    }, (error) => {
      console.error("Error loading announcements:", error);
    });
});

/* ========== FEATURE 2: LOST & FOUND (STUDENT) ========== */
/* REPORT LOST ITEM */
document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("reportLostBtn");
  if(btn){
    btn.onclick = async ()=>{
      const nameEl = document.getElementById("lostItemName");
      const descEl = document.getElementById("lostItemDesc");
      const locationEl = document.getElementById("lostItemLocation");
      const contactEl = document.getElementById("lostItemContact");
      const msgEl = document.getElementById("lostItemMsg");
      
      if(!nameEl || !descEl || !locationEl || !contactEl || !msgEl) return;
      
      const name = nameEl.value.trim();
      const desc = descEl.value.trim();
      const location = locationEl.value.trim();
      const contact = contactEl.value.trim();
      
      if(!name || !desc || !location || !contact){
        msgEl.innerText = "Please fill all fields.";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      if(!auth.currentUser){
        msgEl.innerText = "You must be logged in.";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      try {
        await db.collection("lostFound").add({
          itemName: name,
          description: desc,
          location: location,
          contact: contact,
          reportedBy: auth.currentUser.email,
          status: "lost",
          time: Date.now()
        });
        
        msgEl.innerText = "Lost item reported successfully!";
        msgEl.style.color = "var(--success)";
        nameEl.value = "";
        descEl.value = "";
        locationEl.value = "";
        contactEl.value = "";
      } catch(e){
        msgEl.innerText = "Error: " + e.message;
        msgEl.style.color = "var(--danger)";
      }
    };
  }
});

/* LOAD LOST & FOUND (STUDENT) */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;
  
  const list = document.getElementById("lostFoundList");
  if(!list) return;
  
  db.collection("lostFound")
    .orderBy("time", "desc")
    .onSnapshot((snap)=>{
      let html = "";
      
      if(snap.empty){
        html = `<div class="empty-state"><p>No lost items reported yet.</p></div>`;
      } else {
        snap.forEach(doc=>{
          const d = doc.data();
          const date = new Date(d.time);
          const dateStr = date.toLocaleDateString();
          const statusClass = d.status === "found" ? "status-resolved" : "status-pending";
          
          html += `
            <div class="card" style="border-left: 4px solid ${d.status === "found" ? "var(--success)" : "var(--warning)"};">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
                <b style="font-size:20px;">${d.itemName}</b>
                <span class="status-badge ${statusClass}">${d.status}</span>
              </div>
              <p style="margin:12px 0; color:var(--text-secondary); line-height:1.6;"><strong>Description:</strong> ${d.description}</p>
              <div style="margin:12px 0; padding:12px; background:var(--bg); border-radius:8px;">
                <div style="margin:4px 0;"><strong>Lost Location:</strong> ${d.location}</div>
                <div style="margin:4px 0;"><strong>Contact:</strong> ${d.contact}</div>
                <div style="margin:4px 0; color:var(--text-secondary); font-size:14px;">Reported on: ${dateStr}</div>
              </div>
            </div>
          `;
        });
      }
      
      list.innerHTML = html;
    });
});

/* ========== FEATURE 3: STUDY ROOM BOOKING (STUDENT) ========== */
/* LOAD STUDY ROOMS FOR BOOKING */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;
  
  const roomSelect = document.getElementById("roomSelect");
  if(!roomSelect) return;
  
  // Load available study rooms (we'll use classrooms collection or create study rooms)
  db.collection("classrooms").onSnapshot((snap)=>{
    let html = '<option value="">Select Study Room</option>';
    snap.forEach(doc=>{
      const d = doc.data();
      if(d.status === "free" || d.status === "busy"){
        html += `<option value="${doc.id}">${doc.id}</option>`;
      }
    });
    roomSelect.innerHTML = html;
  });
});

/* BOOK STUDY ROOM */
document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("bookRoomBtn");
  if(btn){
    btn.onclick = async ()=>{
      const roomSelect = document.getElementById("roomSelect");
      const dateEl = document.getElementById("bookingDate");
      const timeEl = document.getElementById("bookingTime");
      const msgEl = document.getElementById("bookingMsg");
      
      if(!roomSelect || !dateEl || !timeEl || !msgEl) return;
      
      const roomId = roomSelect.value;
      const date = dateEl.value;
      const timeSlot = timeEl.value;
      
      if(!roomId || !date || !timeSlot){
        msgEl.innerText = "Please fill all fields.";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      // Check if date is not in the past
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if(selectedDate < today){
        msgEl.innerText = "Cannot book for past dates.";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      if(!auth.currentUser){
        msgEl.innerText = "You must be logged in.";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      // Check for existing booking conflict
      const conflictCheckPending = await db.collection("bookings")
        .where("roomName", "==", roomId)
        .where("date", "==", date)
        .where("timeSlot", "==", timeSlot)
        .where("status", "==", "pending")
        .get();
      
      const conflictCheckConfirmed = await db.collection("bookings")
        .where("roomName", "==", roomId)
        .where("date", "==", date)
        .where("timeSlot", "==", timeSlot)
        .where("status", "==", "confirmed")
        .get();
      
      if(!conflictCheckPending.empty || !conflictCheckConfirmed.empty){
        msgEl.innerText = "This time slot is already booked!";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      try {
        await db.collection("bookings").add({
          roomName: roomId,
          date: date,
          timeSlot: timeSlot,
          userEmail: auth.currentUser.email,
          status: "pending",
          bookedAt: Date.now()
        });
        
        msgEl.innerText = "Booking request submitted! Waiting for admin confirmation.";
        msgEl.style.color = "var(--success)";
        roomSelect.value = "";
        dateEl.value = "";
        timeEl.value = "";
      } catch(e){
        msgEl.innerText = "Error: " + e.message;
        msgEl.style.color = "var(--danger)";
      }
    };
  }
});

/* LOAD MY BOOKINGS */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;
  
  const list = document.getElementById("myBookingsList");
  if(!list) return;
  
  db.collection("bookings")
    .where("userEmail", "==", user.email)
    .onSnapshot((snap)=>{
      let html = "";
      
      if(snap.empty){
        html = `
          <div class="empty-state">
            <p>You haven't booked any study rooms yet.</p>
            <p style="margin-top:12px; color:var(--text-secondary);">Go to "Book Study Room" to make a booking.</p>
          </div>
        `;
      } else {
        const bookings = [];
        snap.forEach(doc=>{
          bookings.push({id: doc.id, ...doc.data()});
        });
        bookings.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if(dateCompare !== 0) return dateCompare;
          return a.timeSlot.localeCompare(b.timeSlot);
        });
        
        bookings.forEach(booking=>{
          const statusClass = booking.status === "confirmed" ? "status-free" : booking.status === "cancelled" ? "status-busy" : "status-pending";
          
          html += `
            <div class="card" style="border-left: 4px solid ${booking.status === "confirmed" ? "var(--success)" : booking.status === "cancelled" ? "var(--danger)" : "var(--warning)"};">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
                <b style="font-size:20px;">${booking.roomName}</b>
                <span class="status-badge ${statusClass}">${booking.status}</span>
              </div>
              <div style="margin:12px 0; padding:12px; background:var(--bg); border-radius:8px;">
                <div style="margin:4px 0;"><strong>Date:</strong> ${booking.date}</div>
                <div style="margin:4px 0;"><strong>Time Slot:</strong> ${booking.timeSlot}</div>
                <div style="margin:4px 0; color:var(--text-secondary); font-size:14px;">
                  ${booking.status === "confirmed" ? 
                    '<span style="color:var(--success); font-weight:600;">✓ Confirmed - Your booking is confirmed!</span>' 
                    : booking.status === "cancelled" ? 
                    '<span style="color:var(--danger);">✗ Cancelled</span>' 
                    : '<span style="color:var(--warning);">⏳ Pending admin approval</span>'
                  }
                </div>
              </div>
            </div>
          `;
        });
      }
      
      list.innerHTML = html;
    });
});

/* LOGOUT */
document.addEventListener("DOMContentLoaded", ()=>{
  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn){
    logoutBtn.onclick = async ()=>{
      await auth.signOut();
      window.location.href = "student_login.html";
    };
  }
});
