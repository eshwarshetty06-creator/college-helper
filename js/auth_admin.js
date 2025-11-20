console.log("auth_admin.js LOADED");

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
const db = firebase.firestore();

/* ADMIN LOGIN */
document.addEventListener("DOMContentLoaded", () => {

  const login = document.getElementById("adminLoginBtn");
  if(login){
    login.onclick = async () => {
      const emailEl = document.getElementById("admin_email");
      const passEl  = document.getElementById("admin_pass");
      
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

      try{
        await auth.signInWithEmailAndPassword(email, pass);

        const snap = await db.collection("admins")
          .where("email","==",email)
          .get();

        if(snap.empty){
          msg("Not an admin!");
          auth.signOut();
          return;
        }

        window.location.href = "admin_home.html";

      }catch(e){
        msg(e.message);
      }
    };
  }

});

/* DISPLAY ERROR MESSAGE */
function msg(m){
  document.getElementById("msg").innerText = m;
}

/* LOAD CLASSROOMS */
firebase.auth().onAuthStateChanged(async (user)=>{
  if(!user) return;

  const list = document.getElementById("adminClassroomList");
  if(list){
    db.collection("classrooms").onSnapshot((snap)=>{
      let html = "";

      snap.forEach(doc=>{
        const d = doc.data();

        const statusClass = d.status === "free" ? "status-free" : d.status === "busy" ? "status-busy" : "status-maintenance";
        html += `
          <div class="card">
            <b>${doc.id}</b>
            <div style="margin:12px 0;">
              <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-secondary);">Status:</label>
              <select onchange="updateClassroom('${doc.id}', this.value)" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border);">
                <option value="free" ${d.status=="free"?"selected":""}>Free</option>
                <option value="busy" ${d.status=="busy"?"selected":""}>Busy</option>
                <option value="maintenance" ${d.status=="maintenance"?"selected":""}>Maintenance</option>
              </select>
            </div>
            <div style="margin:12px 0;">
              <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-secondary);">Noise Level (0-5):</label>
              <input type="number" min="0" max="5" value="${d.noise || 0}"
                onchange="updateNoise('${doc.id}', this.value)" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border);">
            </div>
          </div>
        `;
      });

      list.innerHTML = html;
    });
  }
});

/* UPDATE CLASSROOM */
function updateClassroom(id,value){
  db.collection("classrooms").doc(id).update({ status:value });
}
function updateNoise(id,value){
  db.collection("classrooms").doc(id).update({ noise:Number(value) });
}


/* LOAD ISSUES */
firebase.auth().onAuthStateChanged(async (user)=>{
  if(!user) return;

  const list = document.getElementById("issueList");
  if(!list) return;

  db.collection("issues")
    .orderBy("time","desc")
    .onSnapshot((snap)=>{
      let html = "";

      snap.forEach(doc=>{
        const d = doc.data();

        const statusClass = d.status === "pending" ? "status-pending" : "status-resolved";
        html += `
          <div class="card">
            <b>${d.title}</b>
            <p style="margin:12px 0; color:var(--text-secondary); line-height:1.6;">${d.description}</p>
            <div style="margin:12px 0; padding-top:12px; border-top:1px solid var(--border);">
              <div style="margin:6px 0;"><strong>Reported by:</strong> ${d.user}</div>
              <div style="margin:6px 0;">
                <strong>Status:</strong> 
                <span class="status-badge ${statusClass}">${d.status}</span>
              </div>
            </div>
            ${d.status === "pending" ?
              `<button onclick="markResolved('${doc.id}')" style="margin-top:12px;">Mark Resolved</button>`
              : `<div style="color:var(--success); font-weight:600; margin-top:12px;">✔ Resolved</div>`
            }
          </div>
        `;
      });

      list.innerHTML = html;
    });
});

/* MARK ISSUE RESOLVED */
function markResolved(id){
  db.collection("issues").doc(id).update({ status:"resolved" });
}

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

/* LOGOUT */
document.addEventListener("DOMContentLoaded", ()=>{
  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn){
    logoutBtn.onclick = async ()=>{
      await auth.signOut();
      window.location.href = "admin_login.html";
    };
  }
});

/* SIDEBAR COLLAPSE */
document.addEventListener("DOMContentLoaded", ()=>{
  const collapseBtn = document.getElementById("collapseBtn");
  const sidebar = document.getElementById("sidebar");
  if(collapseBtn && sidebar){
    collapseBtn.onclick = ()=>{
      sidebar.classList.toggle("collapsed");
    };
  }
});

/* ========== FEATURE 1: ANNOUNCEMENTS ========== */
/* POST ANNOUNCEMENT */
document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("postAnnouncementBtn");
  if(btn){
    btn.onclick = async ()=>{
      const titleEl = document.getElementById("announcementTitle");
      const contentEl = document.getElementById("announcementContent");
      const msgEl = document.getElementById("announcementMsg");
      
      if(!titleEl || !contentEl || !msgEl) return;
      
      const title = titleEl.value.trim();
      const content = contentEl.value.trim();
      
      if(!title || !content){
        msgEl.innerText = "Please fill both fields.";
        msgEl.style.color = "var(--danger)";
        return;
      }
      
      try {
        await db.collection("announcements").add({
          title: title,
          content: content,
          postedBy: auth.currentUser.email,
          time: Date.now()
        });
        
        msgEl.innerText = "Announcement posted successfully!";
        msgEl.style.color = "var(--success)";
        titleEl.value = "";
        contentEl.value = "";
      } catch(e){
        msgEl.innerText = "Error: " + e.message;
        msgEl.style.color = "var(--danger)";
      }
    };
  }
});

/* LOAD ANNOUNCEMENTS (ADMIN) */
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
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                <b style="font-size:20px;">${d.title}</b>
                <button onclick="deleteAnnouncement('${doc.id}')" style="padding:6px 12px; background:var(--danger); color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;">Delete</button>
              </div>
              <p style="margin:12px 0; color:var(--text-secondary); line-height:1.6;">${d.content}</p>
              <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border); color:var(--text-secondary); font-size:14px;">
                Posted by: ${d.postedBy} | ${dateStr}
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

function deleteAnnouncement(id){
  if(confirm("Are you sure you want to delete this announcement?")){
    db.collection("announcements").doc(id).delete();
  }
}

/* ========== FEATURE 2: LOST & FOUND ========== */
/* LOAD LOST & FOUND (ADMIN) */
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
                <div style="flex:1;">
                  <b style="font-size:20px;">${d.itemName}</b>
                  <span class="status-badge ${statusClass}" style="margin-left:12px;">${d.status}</span>
                </div>
                ${d.status === "lost" ? 
                  `<button onclick="markFound('${doc.id}')" style="padding:8px 16px; background:var(--success); color:white; border:none; border-radius:6px; cursor:pointer;">Mark as Found</button>` 
                  : ""
                }
              </div>
              <p style="margin:12px 0; color:var(--text-secondary); line-height:1.6;"><strong>Description:</strong> ${d.description}</p>
              <div style="margin:12px 0; padding:12px; background:var(--bg); border-radius:8px;">
                <div style="margin:4px 0;"><strong>Lost Location:</strong> ${d.location}</div>
                <div style="margin:4px 0;"><strong>Contact:</strong> ${d.contact}</div>
                <div style="margin:4px 0;"><strong>Reported by:</strong> ${d.reportedBy}</div>
                <div style="margin:4px 0; color:var(--text-secondary); font-size:14px;">Reported on: ${dateStr}</div>
              </div>
            </div>
          `;
        });
      }
      
      list.innerHTML = html;
    });
});

function markFound(id){
  db.collection("lostFound").doc(id).update({ status: "found" });
}

/* ========== FEATURE 3: STUDY ROOM BOOKINGS ========== */
/* LOAD BOOKINGS (ADMIN) */
firebase.auth().onAuthStateChanged((user)=>{
  if(!user) return;
  
  const list = document.getElementById("bookingsList");
  if(!list) return;
  
  db.collection("bookings")
    .orderBy("date", "asc")
    .orderBy("timeSlot", "asc")
    .onSnapshot((snap)=>{
      let html = "";
      
      if(snap.empty){
        html = `<div class="empty-state"><p>No bookings yet.</p></div>`;
      } else {
        const bookings = [];
        snap.forEach(doc=>{
          bookings.push({id: doc.id, ...doc.data()});
        });
        
        bookings.forEach(booking=>{
          const statusClass = booking.status === "confirmed" ? "status-free" : booking.status === "cancelled" ? "status-busy" : "status-pending";
          
          html += `
            <div class="card" style="border-left: 4px solid ${booking.status === "confirmed" ? "var(--success)" : booking.status === "cancelled" ? "var(--danger)" : "var(--warning)"};">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
                <div style="flex:1;">
                  <b style="font-size:20px;">${booking.roomName}</b>
                  <span class="status-badge ${statusClass}" style="margin-left:12px;">${booking.status}</span>
                </div>
                ${booking.status === "pending" ? 
                  `<div>
                    <button onclick="confirmBooking('${booking.id}')" style="padding:8px 16px; background:var(--success); color:white; border:none; border-radius:6px; cursor:pointer; margin-right:8px;">Confirm</button>
                    <button onclick="cancelBooking('${booking.id}')" style="padding:8px 16px; background:var(--danger); color:white; border:none; border-radius:6px; cursor:pointer;">Cancel</button>
                  </div>` 
                  : ""
                }
              </div>
              <div style="margin:12px 0; padding:12px; background:var(--bg); border-radius:8px;">
                <div style="margin:4px 0;"><strong>Date:</strong> ${booking.date}</div>
                <div style="margin:4px 0;"><strong>Time Slot:</strong> ${booking.timeSlot}</div>
                <div style="margin:4px 0;"><strong>Booked by:</strong> ${booking.userEmail}</div>
                <div style="margin:4px 0; color:var(--text-secondary); font-size:14px;">Booked on: ${new Date(booking.bookedAt).toLocaleString()}</div>
              </div>
            </div>
          `;
        });
      }
      
      list.innerHTML = html;
    });
});

function confirmBooking(id){
  db.collection("bookings").doc(id).update({ status: "confirmed" });
}

function cancelBooking(id){
  if(confirm("Are you sure you want to cancel this booking?")){
    db.collection("bookings").doc(id).update({ status: "cancelled" });
  }
}
